import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Ambulance,
  Activity,
  Stethoscope,
  FileText,
  Heart,
  Brain,
  Wind,
  User,
  Pill,
  Users,
  CheckCircle2,
  
  Thermometer,
  TestTube,
  Clock,
  ClipboardList,
  Shield,
} from "lucide-react";
import { format } from "date-fns";
import { MOCK_TRIAGE, MOCK_HISTORY, MOCK_VITALS } from "@/data/mockClinicalData";
import type { TriageCategory } from "@/types/clinical";
import { VitalsRecorder } from "@/components/clinical/VitalsRecorder";
import { LabResultsSystem } from "@/components/lab/LabResultsSystem";
import { PatientTimeline } from "@/components/timeline/PatientTimeline";
import { ClerkingTemplateSelector } from "@/components/ehr/clerking/ClerkingTemplateSelector";
import { ClerkingFormEditor } from "@/components/ehr/clerking/ClerkingFormEditor";
import { CLERKING_TEMPLATES, type CadreLevel, type ClerkingTemplate } from "@/data/clerkingTemplates";
import { useParams } from "react-router-dom";
import { useCadreFormConfig, setDevCadreOverride, setDevVisitOverride, setDevAcuityOverride, getDevOverrides, useDevOverrideListener, type ClinicalCadre, type VisitType, type AcuityLevel } from "@/hooks/useCadreFormConfig";
import { CadreHistoryForm } from "@/components/ehr/assessment/CadreHistoryForm";
import { CadreExamForm } from "@/components/ehr/assessment/CadreExamForm";

const triageColors: Record<TriageCategory, { bg: string; border: string; text: string; label: string }> = {
  red: { bg: "bg-critical", border: "border-critical", text: "text-critical-foreground", label: "Immediate" },
  orange: { bg: "bg-warning", border: "border-warning", text: "text-warning-foreground", label: "Very Urgent" },
  yellow: { bg: "bg-yellow-500", border: "border-yellow-500", text: "text-black", label: "Urgent" },
  green: { bg: "bg-success", border: "border-success", text: "text-success-foreground", label: "Standard" },
};

function TriagePanel() {
  const triage = MOCK_TRIAGE;
  const color = triageColors[triage.category];
  
  return (
    <div className="space-y-4">
      {/* Triage Category Banner */}
      <Card className={`${color.border} border-2`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full ${color.bg} flex items-center justify-center`}>
                <AlertTriangle className={`w-6 h-6 ${color.text}`} />
              </div>
              <div>
                <div className="text-lg font-semibold">{color.label}</div>
                <div className="text-sm text-muted-foreground">
                  Triaged at {format(triage.triageTime, "HH:mm")} by {triage.triagedBy}
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="mb-1">
                <Ambulance className="w-3 h-3 mr-1" />
                {triage.arrivalMode.replace("-", " ")}
              </Badge>
              <div className="text-xs text-muted-foreground">
                Arrived: {format(triage.arrivalTime, "HH:mm")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chief Complaint */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Chief Complaint</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">{triage.chiefComplaint}</p>
          {triage.notes && (
            <p className="text-sm text-muted-foreground mt-2">{triage.notes}</p>
          )}
        </CardContent>
      </Card>

      {/* Danger Signs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Danger Signs Screening</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {triage.dangerSigns.map(sign => (
              <div 
                key={sign.id} 
                className={`flex items-center gap-2 p-2 rounded-lg ${
                  sign.present ? 'bg-critical/10 border border-critical/30' : 'bg-muted/50'
                }`}
              >
                {sign.present ? (
                  <AlertTriangle className="w-4 h-4 text-critical" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                )}
                <span className="text-sm">{sign.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Triage Vitals */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Triage Vitals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Heart className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
              <div className="text-xl font-semibold">{MOCK_VITALS.heartRate?.value}</div>
              <div className="text-xs text-muted-foreground">HR (bpm)</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Activity className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
              <div className="text-xl font-semibold">
                {MOCK_VITALS.bloodPressure?.systolic.value}/{MOCK_VITALS.bloodPressure?.diastolic.value}
              </div>
              <div className="text-xs text-muted-foreground">BP (mmHg)</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Wind className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
              <div className="text-xl font-semibold">{MOCK_VITALS.spo2?.value}%</div>
              <div className="text-xs text-muted-foreground">SpO₂</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HistoryPanel() {
  const history = MOCK_HISTORY;
  
  return (
    <div className="space-y-4">
      {/* Presenting Complaint - Coded */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Presenting Complaint
            </CardTitle>
            <Badge variant="outline" className="text-[10px]">ICD-10 coded</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="font-medium text-sm">{history.presentingComplaint}</p>
          <Badge variant="secondary" className="mt-2 text-xs">R50.9 — Fever, unspecified</Badge>
        </CardContent>
      </Card>

      {/* HPI - SOCRATES structured */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">History of Present Illness</CardTitle>
            <Badge variant="outline" className="text-[10px]">SOCRATES</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Site", value: "Generalised body aches" },
              { label: "Onset", value: "3 days ago, gradual" },
              { label: "Character", value: "Continuous, dull" },
              { label: "Radiation", value: "None" },
              { label: "Associated Sx", value: "Chills, headache, myalgia" },
              { label: "Timing", value: "Worse at night" },
              { label: "Exacerbating", value: "Activity" },
              { label: "Severity", value: "7/10" },
            ].map(item => (
              <div key={item.label} className="p-2.5 bg-muted/50 rounded-lg">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</div>
                <div className="text-sm font-medium mt-0.5">{item.value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Past Medical History - Coded conditions */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Stethoscope className="w-5 h-5" />
              Past Medical History
            </CardTitle>
            <Badge variant="outline" className="text-[10px]">ICD-10 / SNOMED CT</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {history.pastMedicalHistory.map(condition => (
              <div key={condition.id} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant={condition.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                    {condition.status}
                  </Badge>
                  <span className="font-medium text-sm">{condition.condition}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {condition.condition === "Type 2 Diabetes" ? "E11.9" : 
                     condition.condition === "Hypertension" ? "I10" :
                     condition.condition === "Asthma" ? "J45.9" : "R69"}
                  </Badge>
                  {condition.diagnosed && (
                    <span className="text-xs text-muted-foreground">
                      {format(condition.diagnosed, "MMM yyyy")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Past Surgical History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Past Surgical History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.pastSurgicalHistory.length > 0 ? (
            <div className="space-y-2">
              {history.pastSurgicalHistory.map(surgery => (
                <div key={surgery.id} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">{surgery.procedure}</span>
                  {surgery.date && (
                    <span className="text-xs text-muted-foreground">
                      {format(surgery.date, "MMM yyyy")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No previous surgeries</p>
          )}
        </CardContent>
      </Card>

      {/* Obs/Gyn History */}
      {history.obsGynHistory && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Obstetric & Gynaecological History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              {[
                { val: history.obsGynHistory.gravida, label: "Gravida" },
                { val: history.obsGynHistory.para, label: "Para" },
                { val: history.obsGynHistory.abortions || 0, label: "Abortions" },
                { val: history.obsGynHistory.livingChildren, label: "Living" },
              ].map(item => (
                <div key={item.label} className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{item.val}</div>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>
            {history.obsGynHistory.lastMenstrualPeriod && (
              <div className="mt-3 text-sm">
                <span className="text-muted-foreground">LMP: </span>
                {format(history.obsGynHistory.lastMenstrualPeriod, "dd MMM yyyy")}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Drug History */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Pill className="w-5 h-5" />
              Current Medications
            </CardTitle>
            <Badge variant="outline" className="text-[10px]">SNOMED CT / ATC</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {history.drugHistory.filter(d => d.isCurrentlyTaking).map(drug => (
              <div key={drug.id} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg">
                <div>
                  <span className="font-medium text-sm">{drug.medication}</span>
                  <span className="text-muted-foreground text-sm ml-2">{drug.dose}</span>
                </div>
                <span className="text-sm text-muted-foreground">{drug.frequency}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Allergies */}
      <Card className="border-warning">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-warning">
            <AlertTriangle className="w-5 h-5" />
            Allergies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {history.allergies.map(allergy => (
              <div key={allergy.id} className={`p-3 rounded-lg ${
                allergy.severity === 'life_threatening' ? 'bg-critical/10 border border-critical/30' :
                allergy.severity === 'severe' ? 'bg-warning/10 border border-warning/30' :
                'bg-muted/50'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{allergy.allergen}</span>
                  <Badge variant={allergy.severity === 'life_threatening' ? 'destructive' : 'outline'}>
                    {allergy.severity.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{allergy.reaction}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Social History */}
      {history.socialHistory && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5" />
              Social History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Occupation", value: history.socialHistory.occupation || "—" },
                { label: "Smoking", value: history.socialHistory.smokingStatus },
                { label: "Alcohol", value: history.socialHistory.alcoholUse },
              ].map(item => (
                <div key={item.label} className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                  <div className="font-medium text-sm capitalize">{item.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/** Structured Physical Examination — zero free-text, all coded */
function ExaminationPanel() {
  const [findings, setFindings] = useState<Record<string, string>>({
    // General
    consciousness: "Alert",
    distress: "Not in distress",
    build: "Average",
    hydration: "Well hydrated",
    pallor: "Absent",
    jaundice: "Absent",
    cyanosis: "Absent",
    clubbing: "Absent",
    edema: "Absent",
    lymphadenopathy: "Absent",
    // CVS
    pulse_rate: "78",
    pulse_rhythm: "Regular",
    pulse_volume: "Normal",
    bp_systolic: "130",
    bp_diastolic: "82",
    jvp: "Not raised",
    apex_beat: "5th ICS MCL",
    heart_sounds: "S1 S2 normal",
    murmurs: "None",
    // Respiratory
    resp_rate: "18",
    breathing_pattern: "Normal",
    trachea: "Central",
    chest_expansion: "Symmetrical",
    percussion: "Resonant bilaterally",
    breath_sounds: "Vesicular",
    added_sounds: "None",
    spo2: "97",
    // Abdominal
    abdo_shape: "Flat",
    abdo_tenderness: "RUQ tenderness",
    abdo_guarding: "Absent",
    abdo_rigidity: "Absent",
    abdo_rebound: "Absent",
    liver: "Not palpable",
    spleen: "Not palpable",
    kidneys: "Not ballotable",
    bowel_sounds: "Normal",
    ascites: "Absent",
    murphy_sign: "Positive",
    // Neuro
    gcs_eye: "4",
    gcs_verbal: "5",
    gcs_motor: "6",
    pupils: "Equal and reactive",
    focal_deficit: "None",
    power_upper: "5/5",
    power_lower: "5/5",
    tone: "Normal",
    reflexes: "Normal",
    meningism: "Absent",
  });

  const updateFinding = (key: string, value: string) => {
    setFindings(prev => ({ ...prev, [key]: value }));
  };

  const SelectField = ({ label, fieldKey, options }: { label: string; fieldKey: string; options: string[] }) => (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      <select
        value={findings[fieldKey]}
        onChange={e => updateFinding(fieldKey, e.target.value)}
        className="w-full h-9 px-2 text-sm rounded-md border border-input bg-background focus:ring-1 focus:ring-ring"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const NumberField = ({ label, fieldKey, unit }: { label: string; fieldKey: string; unit?: string }) => (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={findings[fieldKey]}
          onChange={e => updateFinding(fieldKey, e.target.value)}
          className="w-full h-9 px-2 text-sm rounded-md border border-input bg-background focus:ring-1 focus:ring-ring tabular-nums"
        />
        {unit && <span className="text-xs text-muted-foreground shrink-0">{unit}</span>}
      </div>
    </div>
  );

  const gcsTotal = (parseInt(findings.gcs_eye) || 0) + (parseInt(findings.gcs_verbal) || 0) + (parseInt(findings.gcs_motor) || 0);

  return (
    <div className="space-y-4">
      {/* General Examination */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-5 h-5" />
              General Examination
            </CardTitle>
            <Badge variant="outline" className="text-[10px]">SNOMED CT coded</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <SelectField label="Consciousness" fieldKey="consciousness" options={["Alert", "Drowsy", "Confused", "Obtunded", "Comatose"]} />
            <SelectField label="Distress" fieldKey="distress" options={["Not in distress", "Mild distress", "Moderate distress", "Severe distress"]} />
            <SelectField label="Build" fieldKey="build" options={["Wasted", "Thin", "Average", "Overweight", "Obese"]} />
            <SelectField label="Hydration" fieldKey="hydration" options={["Well hydrated", "Mild dehydration", "Moderate dehydration", "Severe dehydration"]} />
            <SelectField label="Pallor" fieldKey="pallor" options={["Absent", "Mild", "Moderate", "Severe"]} />
            <SelectField label="Jaundice" fieldKey="jaundice" options={["Absent", "Present"]} />
            <SelectField label="Cyanosis" fieldKey="cyanosis" options={["Absent", "Peripheral", "Central"]} />
            <SelectField label="Clubbing" fieldKey="clubbing" options={["Absent", "Present"]} />
            <SelectField label="Oedema" fieldKey="edema" options={["Absent", "Pitting - ankles", "Pitting - knees", "Pitting - sacral", "Generalised", "Non-pitting"]} />
            <SelectField label="Lymphadenopathy" fieldKey="lymphadenopathy" options={["Absent", "Cervical", "Axillary", "Inguinal", "Generalised"]} />
          </div>
        </CardContent>
      </Card>

      {/* Cardiovascular */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Cardiovascular System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <NumberField label="Pulse Rate" fieldKey="pulse_rate" unit="bpm" />
            <SelectField label="Rhythm" fieldKey="pulse_rhythm" options={["Regular", "Regularly irregular", "Irregularly irregular"]} />
            <SelectField label="Volume" fieldKey="pulse_volume" options={["Normal", "Bounding", "Thready", "Weak"]} />
            <NumberField label="Systolic BP" fieldKey="bp_systolic" unit="mmHg" />
            <NumberField label="Diastolic BP" fieldKey="bp_diastolic" unit="mmHg" />
            <SelectField label="JVP" fieldKey="jvp" options={["Not raised", "Raised", "Not visible"]} />
            <SelectField label="Heart Sounds" fieldKey="heart_sounds" options={["S1 S2 normal", "S3 present", "S4 present", "Muffled", "Loud S2"]} />
            <SelectField label="Murmurs" fieldKey="murmurs" options={["None", "Systolic - apex", "Systolic - LLSE", "Diastolic", "Pan-systolic", "Ejection systolic"]} />
          </div>
        </CardContent>
      </Card>

      {/* Respiratory */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Wind className="w-5 h-5" />
            Respiratory System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <NumberField label="Resp Rate" fieldKey="resp_rate" unit="/min" />
            <SelectField label="Pattern" fieldKey="breathing_pattern" options={["Normal", "Tachypnoea", "Bradypnoea", "Kussmaul", "Cheyne-Stokes"]} />
            <SelectField label="Trachea" fieldKey="trachea" options={["Central", "Deviated left", "Deviated right"]} />
            <SelectField label="Chest Expansion" fieldKey="chest_expansion" options={["Symmetrical", "Reduced left", "Reduced right", "Reduced bilaterally"]} />
            <SelectField label="Percussion" fieldKey="percussion" options={["Resonant bilaterally", "Dull left", "Dull right", "Dull bilaterally", "Stony dull", "Hyperresonant"]} />
            <SelectField label="Breath Sounds" fieldKey="breath_sounds" options={["Vesicular", "Bronchial", "Reduced left", "Reduced right", "Reduced bilaterally", "Absent"]} />
            <SelectField label="Added Sounds" fieldKey="added_sounds" options={["None", "Fine crackles", "Coarse crackles", "Wheeze", "Pleural rub", "Stridor"]} />
            <NumberField label="SpO₂" fieldKey="spo2" unit="%" />
          </div>
        </CardContent>
      </Card>

      {/* Abdominal */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Abdominal Examination
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <SelectField label="Shape" fieldKey="abdo_shape" options={["Flat", "Distended", "Scaphoid", "Obese"]} />
            <SelectField label="Tenderness" fieldKey="abdo_tenderness" options={["None", "RUQ tenderness", "RLQ tenderness", "LUQ tenderness", "LLQ tenderness", "Epigastric", "Suprapubic", "Generalised"]} />
            <SelectField label="Guarding" fieldKey="abdo_guarding" options={["Absent", "Voluntary", "Involuntary"]} />
            <SelectField label="Rigidity" fieldKey="abdo_rigidity" options={["Absent", "Present"]} />
            <SelectField label="Rebound" fieldKey="abdo_rebound" options={["Absent", "Present"]} />
            <SelectField label="Liver" fieldKey="liver" options={["Not palpable", "Palpable - smooth", "Palpable - irregular", "Tender"]} />
            <SelectField label="Spleen" fieldKey="spleen" options={["Not palpable", "1 finger", "2 fingers", "3 fingers", "Massive"]} />
            <SelectField label="Bowel Sounds" fieldKey="bowel_sounds" options={["Normal", "Hyperactive", "Hypoactive", "Absent", "Tinkling"]} />
            <SelectField label="Ascites" fieldKey="ascites" options={["Absent", "Mild", "Moderate", "Tense"]} />
            <SelectField label="Murphy's Sign" fieldKey="murphy_sign" options={["Negative", "Positive"]} />
          </div>
        </CardContent>
      </Card>

      {/* Neurological */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Neurological Examination
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* GCS structured */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Glasgow Coma Scale</span>
                <Badge variant={gcsTotal >= 13 ? "default" : gcsTotal >= 9 ? "secondary" : "destructive"} className="text-sm font-bold">
                  GCS {gcsTotal}/15
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <SelectField label="Eye (E)" fieldKey="gcs_eye" options={["1", "2", "3", "4"]} />
                <SelectField label="Verbal (V)" fieldKey="gcs_verbal" options={["1", "2", "3", "4", "5"]} />
                <SelectField label="Motor (M)" fieldKey="gcs_motor" options={["1", "2", "3", "4", "5", "6"]} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <SelectField label="Pupils" fieldKey="pupils" options={["Equal and reactive", "Unequal", "Fixed dilated", "Fixed constricted", "Sluggish"]} />
              <SelectField label="Focal Deficit" fieldKey="focal_deficit" options={["None", "Left hemiparesis", "Right hemiparesis", "Paraparesis", "Cranial nerve palsy"]} />
              <SelectField label="Meningism" fieldKey="meningism" options={["Absent", "Neck stiffness", "Kernig positive", "Brudzinski positive"]} />
              <SelectField label="Upper Limb Power" fieldKey="power_upper" options={["0/5", "1/5", "2/5", "3/5", "4/5", "5/5"]} />
              <SelectField label="Lower Limb Power" fieldKey="power_lower" options={["0/5", "1/5", "2/5", "3/5", "4/5", "5/5"]} />
              <SelectField label="Tone" fieldKey="tone" options={["Normal", "Increased - spasticity", "Increased - rigidity", "Decreased", "Flaccid"]} />
              <SelectField label="Reflexes" fieldKey="reflexes" options={["Normal", "Hyperreflexic", "Hyporeflexic", "Absent", "Clonus present"]} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button>
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Save Examination
        </Button>
      </div>
    </div>
  );
}

function ClerkingPanel() {
  const { encounterId } = useParams<{ encounterId?: string }>();
  const [selectedTemplate, setSelectedTemplate] = useState<ClerkingTemplate | null>(null);
  const [selectedCadre, setSelectedCadre] = useState<CadreLevel>("intern");

  const handleTemplateSelect = (template: ClerkingTemplate, cadre: CadreLevel) => {
    setSelectedTemplate(template);
    setSelectedCadre(cadre);
  };

  const handleFormSave = (data: Record<string, string>) => {
    console.log("Saving clerking form:", data);
    // Save to database
  };

  const handleFormSign = (data: Record<string, string>) => {
    console.log("Signing clerking form:", data);
    // Sign and finalize
  };

  if (!selectedTemplate) {
    return <ClerkingTemplateSelector onSelect={handleTemplateSelect} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setSelectedTemplate(null)}>
          ← Back to Templates
        </Button>
      </div>
      <ClerkingFormEditor
        template={selectedTemplate}
        cadreLevel={selectedCadre}
        encounterId={encounterId}
        onSave={handleFormSave}
        onSign={handleFormSign}
      />
    </div>
  );
}

export function AssessmentSection() {
  const { encounterId } = useParams<{ encounterId?: string }>();
  const cadreConfig = useCadreFormConfig();

  // Determine which tabs to show based on cadre
  const isSimplified = cadreConfig.complexity === 'simplified';
  const isFocused = cadreConfig.complexity === 'focused';

  return (
    <Tabs defaultValue={isSimplified ? "history" : "triage"} className="space-y-4">
      <TabsList className={`grid w-full h-12 ${isSimplified ? 'grid-cols-4' : isFocused ? 'grid-cols-6' : 'grid-cols-7'}`}>
        {/* Triage - hidden for CHW */}
        {!isSimplified && (
          <TabsTrigger value="triage" className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="w-5 h-5" />
            Triage
          </TabsTrigger>
        )}
        {/* Vitals - shown for nurse & doctor */}
        {!isSimplified && (
          <TabsTrigger value="record-vitals" className="flex items-center gap-2 text-sm font-medium">
            <Thermometer className="w-5 h-5" />
            Vitals
          </TabsTrigger>
        )}
        {/* Clerking - doctor only */}
        {cadreConfig.complexity === 'comprehensive' && (
          <TabsTrigger value="clerking" className="flex items-center gap-2 text-sm font-medium">
            <ClipboardList className="w-5 h-5" />
            Clerking
          </TabsTrigger>
        )}
        {/* History - cadre-adaptive label */}
        <TabsTrigger value="history" className="flex items-center gap-2 text-sm font-medium">
          {isSimplified ? <Shield className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          {cadreConfig.labels.historyTabLabel}
        </TabsTrigger>
        {/* Exam - cadre-adaptive label */}
        <TabsTrigger value="examination" className="flex items-center gap-2 text-sm font-medium">
          <Stethoscope className="w-5 h-5" />
          {cadreConfig.labels.examTabLabel}
        </TabsTrigger>
        {/* Labs - hidden for CHW */}
        {!isSimplified && (
          <TabsTrigger value="labs" className="flex items-center gap-2 text-sm font-medium">
            <TestTube className="w-5 h-5" />
            Labs
          </TabsTrigger>
        )}
        {/* Timeline */}
        <TabsTrigger value="timeline" className="flex items-center gap-2 text-sm font-medium">
          <Clock className="w-5 h-5" />
          Timeline
        </TabsTrigger>
      </TabsList>

      {/* Cadre Context Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs capitalize">
          {cadreConfig.cadre} · {cadreConfig.complexity}
        </Badge>
        <Badge variant="secondary" className="text-xs capitalize">
          {cadreConfig.visitType} visit
        </Badge>
        <Badge variant={cadreConfig.acuity === 'red' ? 'destructive' : cadreConfig.acuity === 'orange' ? 'default' : 'secondary'} className="text-xs capitalize">
          {cadreConfig.acuity} acuity
        </Badge>
      </div>

      {!isSimplified && (
        <TabsContent value="triage">
          <TriagePanel />
        </TabsContent>
      )}

      {!isSimplified && (
        <TabsContent value="record-vitals">
          {encounterId ? (
            <VitalsRecorder encounterId={encounterId} />
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Select a patient encounter to record vitals
              </CardContent>
            </Card>
          )}
        </TabsContent>
      )}

      {cadreConfig.complexity === 'comprehensive' && (
        <TabsContent value="clerking">
          <ClerkingPanel />
        </TabsContent>
      )}

      <TabsContent value="history">
        <CadreHistoryForm config={cadreConfig} />
      </TabsContent>

      <TabsContent value="examination">
        <CadreExamForm config={cadreConfig} />
      </TabsContent>

      {!isSimplified && (
        <TabsContent value="labs">
          <LabResultsSystem />
        </TabsContent>
      )}

      <TabsContent value="timeline">
        <PatientTimeline />
      </TabsContent>
    </Tabs>
  );
}
