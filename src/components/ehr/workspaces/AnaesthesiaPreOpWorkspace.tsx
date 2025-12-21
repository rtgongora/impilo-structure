import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Stethoscope, AlertTriangle, Clock, Activity, 
  ChevronRight, CheckCircle, FileText, Heart, Wind,
  Pill, Scale, Eye, ThermometerIcon
} from "lucide-react";
import { useState } from "react";

const MEDICAL_HISTORY_CATEGORIES = [
  {
    category: "Cardiovascular",
    conditions: ["Hypertension", "Ischemic heart disease", "Heart failure", "Arrhythmias", "Valvular disease", "Pacemaker/ICD"]
  },
  {
    category: "Respiratory",
    conditions: ["Asthma", "COPD", "OSA/Sleep apnea", "Recent URTI", "Smoking", "Home oxygen"]
  },
  {
    category: "Endocrine/Metabolic",
    conditions: ["Diabetes mellitus", "Thyroid disease", "Obesity (BMI>30)", "Adrenal disorders"]
  },
  {
    category: "Neurological",
    conditions: ["Stroke/TIA", "Epilepsy", "Neuromuscular disease", "Raised ICP"]
  },
  {
    category: "Renal/Hepatic",
    conditions: ["Chronic kidney disease", "Dialysis", "Liver disease", "Coagulopathy"]
  },
  {
    category: "Other",
    conditions: ["GERD/Reflux", "Rheumatoid arthritis", "Pregnancy", "Malignant hyperthermia history", "PONV history"]
  }
];

const ASA_CLASSIFICATIONS = [
  { class: 1, description: "Healthy patient", examples: "No systemic disease" },
  { class: 2, description: "Mild systemic disease", examples: "Well-controlled DM, HTN, mild obesity" },
  { class: 3, description: "Severe systemic disease", examples: "Poorly controlled DM, ESRD on dialysis, stable angina" },
  { class: 4, description: "Severe disease - constant threat to life", examples: "Recent MI, severe valve disease, sepsis" },
  { class: 5, description: "Moribund - not expected to survive without surgery", examples: "Ruptured AAA, massive trauma" },
  { class: 6, description: "Brain-dead organ donor", examples: "N/A" }
];

const AIRWAY_PREDICTORS = [
  { id: "mallampati", label: "Mallampati Score", options: ["I", "II", "III", "IV"] },
  { id: "thyromental", label: "Thyromental Distance", options: [">6cm", "4-6cm", "<4cm"] },
  { id: "mouthOpening", label: "Mouth Opening", options: [">3 fingers", "2-3 fingers", "<2 fingers"] },
  { id: "neckMobility", label: "Neck Extension", options: ["Normal", "Limited", "Fixed"] },
  { id: "dentition", label: "Dentition", options: ["Normal", "Poor/Loose", "Dentures", "Edentulous"] },
  { id: "beardNeck", label: "Beard/Short Neck", options: ["No", "Yes"] },
];

const FASTING_STATUS = [
  { type: "Clear fluids", minimum: "2 hours" },
  { type: "Breast milk", minimum: "4 hours" },
  { type: "Light meal/formula", minimum: "6 hours" },
  { type: "Heavy meal/fatty foods", minimum: "8 hours" },
];

const INVESTIGATIONS_CHECKLIST = [
  { id: "fbc", label: "FBC", indication: "Major surgery, blood loss expected" },
  { id: "uande", label: "U&E", indication: "Renal disease, diuretics, diabetes" },
  { id: "lft", label: "LFTs", indication: "Liver disease, alcohol" },
  { id: "coag", label: "Coagulation", indication: "Anticoagulants, liver disease" },
  { id: "glucose", label: "Glucose", indication: "Diabetes" },
  { id: "ecg", label: "ECG", indication: "Cardiac history, >65 years" },
  { id: "cxr", label: "Chest X-ray", indication: "Respiratory disease, cardiac" },
  { id: "echo", label: "Echocardiogram", indication: "Valvular disease, heart failure" },
  { id: "pft", label: "Pulmonary Function Tests", indication: "Severe respiratory disease" },
  { id: "groupsave", label: "Group & Save/Crossmatch", indication: "Blood loss expected" },
];

export function AnaesthesiaPreOpWorkspace() {
  const [currentPhase, setCurrentPhase] = useState<"history" | "airway" | "investigations" | "plan">("history");
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [asaClass, setAsaClass] = useState<number | null>(null);
  const [airwayAssessment, setAirwayAssessment] = useState<Record<string, string>>({});
  const [selectedInvestigations, setSelectedInvestigations] = useState<string[]>([]);
  const [fastingConfirmed, setFastingConfirmed] = useState(false);

  const toggleCondition = (condition: string) => {
    setSelectedConditions(prev => 
      prev.includes(condition) ? prev.filter(c => c !== condition) : [...prev, condition]
    );
  };

  const updateAirway = (id: string, value: string) => {
    setAirwayAssessment(prev => ({ ...prev, [id]: value }));
  };

  const toggleInvestigation = (id: string) => {
    setSelectedInvestigations(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getDifficultAirwayRisk = () => {
    const risks = [
      airwayAssessment.mallampati === "III" || airwayAssessment.mallampati === "IV",
      airwayAssessment.thyromental === "<4cm",
      airwayAssessment.mouthOpening === "<2 fingers",
      airwayAssessment.neckMobility === "Fixed",
      airwayAssessment.beardNeck === "Yes",
    ].filter(Boolean).length;
    
    if (risks >= 3) return "high";
    if (risks >= 1) return "moderate";
    return "low";
  };

  const phases = [
    { id: "history", label: "Medical History" },
    { id: "airway", label: "Airway Exam" },
    { id: "investigations", label: "Investigations" },
    { id: "plan", label: "Plan & Clearance" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Stethoscope className="w-5 h-5 text-primary" />
              <span className="font-medium">Anaesthesia Pre-Operative Assessment</span>
            </div>
            <div className="flex items-center gap-4">
              {asaClass && (
                <Badge variant={asaClass <= 2 ? "default" : asaClass <= 3 ? "secondary" : "destructive"}>
                  ASA {asaClass}
                </Badge>
              )}
              {Object.keys(airwayAssessment).length > 0 && (
                <Badge variant={getDifficultAirwayRisk() === "high" ? "destructive" : getDifficultAirwayRisk() === "moderate" ? "secondary" : "outline"}>
                  Airway Risk: {getDifficultAirwayRisk()}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {phases.map((phase, idx) => (
          <div key={phase.id} className="flex items-center">
            <Button
              variant={currentPhase === phase.id ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPhase(phase.id as typeof currentPhase)}
              className="whitespace-nowrap"
            >
              <span className="w-5 h-5 rounded-full bg-background/20 flex items-center justify-center text-xs mr-2">
                {idx + 1}
              </span>
              {phase.label}
            </Button>
            {idx < phases.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />}
          </div>
        ))}
      </div>

      {/* Medical History Phase */}
      {currentPhase === "history" && (
        <div className="grid grid-cols-2 gap-6">
          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Medical History & Comorbidities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {MEDICAL_HISTORY_CATEGORIES.map((cat) => (
                  <div key={cat.category} className="p-3 border rounded-lg">
                    <p className="text-sm font-medium text-primary mb-2">{cat.category}</p>
                    <div className="space-y-2">
                      {cat.conditions.map((condition) => (
                        <div 
                          key={condition}
                          className={`flex items-center gap-2 ${
                            selectedConditions.includes(condition) ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          <Checkbox
                            checked={selectedConditions.includes(condition)}
                            onCheckedChange={() => toggleCondition(condition)}
                          />
                          <Label className="text-xs cursor-pointer">{condition}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {selectedConditions.length > 0 && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Selected Conditions ({selectedConditions.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedConditions.map((condition) => (
                      <Badge key={condition} variant="secondary" className="text-xs">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Pill className="w-5 h-5 text-primary" />
                Current Medications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea placeholder="List all current medications with doses..." className="min-h-[100px]" />
              
              <div className="space-y-2">
                <p className="text-sm font-medium">High-Risk Medications</p>
                {[
                  "Anticoagulants (Warfarin, DOACs)",
                  "Antiplatelets (Aspirin, Clopidogrel)",
                  "Insulin/Oral hypoglycemics",
                  "ACE inhibitors/ARBs",
                  "MAO inhibitors",
                  "Herbal supplements",
                ].map((med) => (
                  <div key={med} className="flex items-center gap-2">
                    <Checkbox />
                    <Label className="text-xs">{med}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Allergies & Previous Anaesthesia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">Drug Allergies</Label>
                <Textarea placeholder="List allergies and reactions..." className="mt-1 h-16" />
              </div>

              <div>
                <Label className="text-sm">Previous Anaesthesia</Label>
                <div className="space-y-2 mt-2">
                  {[
                    "General anaesthesia - uneventful",
                    "Difficult intubation",
                    "PONV (nausea/vomiting)",
                    "Adverse drug reaction",
                    "Prolonged wake-up",
                    "Awareness under anaesthesia",
                    "Family history MH",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <Checkbox />
                      <Label className="text-xs">{item}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                ASA Physical Status Classification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {ASA_CLASSIFICATIONS.slice(0, 5).map((asa) => (
                  <div
                    key={asa.class}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      asaClass === asa.class ? "border-primary bg-primary/5" : "hover:border-primary/50"
                    }`}
                    onClick={() => setAsaClass(asa.class)}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant={asa.class <= 2 ? "default" : asa.class <= 3 ? "secondary" : "destructive"}>
                        ASA {asa.class}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium mt-2">{asa.description}</p>
                    <p className="text-xs text-muted-foreground">{asa.examples}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="col-span-2 flex justify-end">
            <Button onClick={() => setCurrentPhase("airway")}>
              Proceed to Airway Exam
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Airway Phase */}
      {currentPhase === "airway" && (
        <div className="grid grid-cols-2 gap-6">
          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wind className="w-5 h-5 text-primary" />
                Airway Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {AIRWAY_PREDICTORS.map((predictor) => (
                  <div key={predictor.id} className="p-3 border rounded-lg">
                    <Label className="text-sm font-medium">{predictor.label}</Label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {predictor.options.map((option) => (
                        <Badge
                          key={option}
                          variant={airwayAssessment[predictor.id] === option ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => updateAirway(predictor.id, option)}
                        >
                          {option}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {getDifficultAirwayRisk() !== "low" && (
                <div className={`mt-4 p-4 rounded-lg border-2 ${
                  getDifficultAirwayRisk() === "high" ? "border-destructive bg-destructive/5" : "border-warning bg-warning/5"
                }`}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-5 h-5 ${getDifficultAirwayRisk() === "high" ? "text-destructive" : "text-warning"}`} />
                    <span className="font-medium">
                      {getDifficultAirwayRisk() === "high" ? "HIGH RISK" : "MODERATE RISK"} - Difficult Airway Predicted
                    </span>
                  </div>
                  <p className="text-sm mt-2">
                    Consider: Senior anaesthetist, difficult airway equipment, awake fibreoptic, videolaryngoscopy
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Physical Examination
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Height (cm)</Label>
                  <Input type="number" placeholder="170" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Weight (kg)</Label>
                  <Input type="number" placeholder="70" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">BMI</Label>
                  <Input readOnly value="24.2" className="mt-1 bg-muted" />
                </div>
                <div>
                  <Label className="text-sm">BP</Label>
                  <Input placeholder="120/80" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">HR</Label>
                  <Input placeholder="72" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">SpO2</Label>
                  <Input placeholder="98%" className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Cardiovascular & Respiratory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">Functional Capacity (METs)</Label>
                <select className="w-full mt-1 border rounded-lg p-2">
                  <option>&gt;4 METs (climb 2 flights, walk uphill)</option>
                  <option>1-4 METs (walk on flat, light housework)</option>
                  <option>&lt;1 METs (unable to self-care)</option>
                  <option>Unable to assess</option>
                </select>
              </div>

              <div>
                <Label className="text-sm">Heart Sounds</Label>
                <Input placeholder="S1 S2, no murmurs" className="mt-1" />
              </div>

              <div>
                <Label className="text-sm">Breath Sounds</Label>
                <Input placeholder="Clear, equal air entry" className="mt-1" />
              </div>

              <div>
                <Label className="text-sm">Exercise Tolerance</Label>
                <Textarea placeholder="Details of exercise limitation..." className="mt-1 h-16" />
              </div>
            </CardContent>
          </Card>

          <div className="col-span-2 flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("history")}>Back</Button>
            <Button onClick={() => setCurrentPhase("investigations")}>
              Proceed to Investigations
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Investigations Phase */}
      {currentPhase === "investigations" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Required Investigations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {INVESTIGATIONS_CHECKLIST.map((inv) => (
                <div 
                  key={inv.id}
                  className={`p-2 border rounded-lg ${
                    selectedInvestigations.includes(inv.id) ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedInvestigations.includes(inv.id)}
                      onCheckedChange={() => toggleInvestigation(inv.id)}
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium">{inv.label}</span>
                      <p className="text-xs text-muted-foreground">{inv.indication}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Fasting Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {FASTING_STATUS.map((item) => (
                  <div key={item.type} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{item.type}</span>
                    <Badge variant="outline">{item.minimum}</Badge>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t">
                <div>
                  <Label className="text-sm">Last Oral Intake</Label>
                  <Input type="datetime-local" className="mt-1" />
                </div>

                <div className="flex items-center gap-3 mt-4 p-3 border rounded-lg">
                  <Checkbox
                    checked={fastingConfirmed}
                    onCheckedChange={(checked) => setFastingConfirmed(checked as boolean)}
                  />
                  <Label className="text-sm font-medium">
                    Fasting status confirmed and adequate for planned procedure
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Results Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="Document review of investigation results, any abnormalities, and clinical significance..."
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>

          <div className="col-span-2 flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("airway")}>Back</Button>
            <Button onClick={() => setCurrentPhase("plan")}>
              Proceed to Plan
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Plan Phase */}
      {currentPhase === "plan" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-primary" />
                Anaesthesia Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">Proposed Anaesthetic Technique</Label>
                <select className="w-full mt-1 border rounded-lg p-2">
                  <option>General Anaesthesia</option>
                  <option>Spinal Anaesthesia</option>
                  <option>Epidural Anaesthesia</option>
                  <option>Combined Spinal-Epidural</option>
                  <option>Regional Block + Sedation</option>
                  <option>Local Anaesthesia + Sedation</option>
                  <option>MAC (Monitored Anaesthesia Care)</option>
                </select>
              </div>

              <div>
                <Label className="text-sm">Airway Plan</Label>
                <select className="w-full mt-1 border rounded-lg p-2">
                  <option>Standard induction, direct laryngoscopy</option>
                  <option>Videolaryngoscopy primary</option>
                  <option>LMA/SGA</option>
                  <option>Awake fibreoptic intubation</option>
                  <option>Rapid sequence induction</option>
                </select>
              </div>

              <div>
                <Label className="text-sm">Special Considerations</Label>
                <div className="space-y-2 mt-2">
                  {[
                    "Difficult airway equipment",
                    "Arterial line",
                    "Central venous access",
                    "Cell saver",
                    "BIS monitoring",
                    "Nerve stimulator",
                    "TEE",
                    "Post-op ICU/HDU",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <Checkbox />
                      <Label className="text-xs">{item}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Pill className="w-5 h-5 text-primary" />
                Pre-operative Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">Pre-medication</Label>
                <div className="space-y-2 mt-2">
                  {[
                    "None required",
                    "Anxiolytic (e.g., Midazolam)",
                    "Antacid prophylaxis",
                    "Antiemetic (PONV risk)",
                    "Continue regular medications",
                    "Beta-blocker continuation",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <Checkbox />
                      <Label className="text-xs">{item}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm">Medication Instructions</Label>
                <Textarea placeholder="Hold/continue specific medications..." className="mt-1" />
              </div>

              <div>
                <Label className="text-sm">Diabetic Management Plan (if applicable)</Label>
                <Textarea placeholder="Insulin/OHA instructions..." className="mt-1" />
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Clearance Decision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {[
                  { id: "cleared", label: "CLEARED for Anaesthesia", color: "bg-green-500" },
                  { id: "optimise", label: "OPTIMISATION Required", color: "bg-warning" },
                  { id: "postpone", label: "POSTPONE - Not fit", color: "bg-destructive" },
                ].map((decision) => (
                  <Button
                    key={decision.id}
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <div className={`w-4 h-4 rounded-full ${decision.color}`} />
                    <span className="text-sm font-medium">{decision.label}</span>
                  </Button>
                ))}
              </div>

              <div>
                <Label className="text-sm">Optimisation / Conditions</Label>
                <Textarea 
                  placeholder="If optimisation needed or conditions for clearance..."
                  className="mt-1"
                />
              </div>

              <div className="mt-4 grid grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold">ASA {asaClass || "-"}</p>
                  <p className="text-xs text-muted-foreground">Classification</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold capitalize">{getDifficultAirwayRisk()}</p>
                  <p className="text-xs text-muted-foreground">Airway Risk</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold">{selectedConditions.length}</p>
                  <p className="text-xs text-muted-foreground">Comorbidities</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold">{selectedInvestigations.length}</p>
                  <p className="text-xs text-muted-foreground">Investigations</p>
                </div>
              </div>

              <div className="flex justify-end mt-4 gap-2">
                <Button variant="outline">Print Assessment</Button>
                <Button>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Assessment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
