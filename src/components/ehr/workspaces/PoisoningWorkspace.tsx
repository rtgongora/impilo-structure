import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  Skull, AlertTriangle, Clock, Activity, Plus, 
  ChevronRight, CheckCircle, FileText, Heart, Brain,
  Beaker, Phone, Shield, Thermometer
} from "lucide-react";
import { useState } from "react";

interface VitalEntry {
  time: string;
  gcs: number;
  hr: number;
  bp: string;
  rr: number;
  spo2: number;
  temp: number;
  glucose: number;
  pupils: string;
}

const COMMON_TOXIDROMES = [
  { name: "Anticholinergic", signs: "Hot, dry, red, blind, mad, tachycardia" },
  { name: "Cholinergic", signs: "SLUDGE: Salivation, Lacrimation, Urination, Defecation, GI, Emesis" },
  { name: "Sympathomimetic", signs: "Tachycardia, HTN, hyperthermia, diaphoresis, mydriasis" },
  { name: "Opioid", signs: "CNS depression, miosis, respiratory depression" },
  { name: "Sedative-Hypnotic", signs: "CNS depression, normal pupils, hypothermia" },
  { name: "Serotonin Syndrome", signs: "Hyperthermia, rigidity, clonus, altered mental status" },
];

const DECONTAMINATION_OPTIONS = [
  { id: "ac", label: "Activated Charcoal", indication: "Within 1h of ingestion, intact airway" },
  { id: "wbi", label: "Whole Bowel Irrigation", indication: "Sustained-release, packets, iron, lithium" },
  { id: "lavage", label: "Gastric Lavage", indication: "Rarely indicated, within 1h, life-threatening" },
  { id: "none", label: "No Decontamination", indication: "Late presentation, already absorbed" },
];

const COMMON_ANTIDOTES = [
  { toxin: "Opioids", antidote: "Naloxone", dose: "0.4-2mg IV, repeat PRN" },
  { toxin: "Benzodiazepines", antidote: "Flumazenil", dose: "0.2mg IV (caution: seizures)" },
  { toxin: "Paracetamol", antidote: "N-Acetylcysteine", dose: "Per Rumack-Matthew nomogram" },
  { toxin: "Organophosphates", antidote: "Atropine + Pralidoxime", dose: "Atropine 2mg IV, double q5min" },
  { toxin: "Beta-blockers", antidote: "Glucagon", dose: "5-10mg IV bolus" },
  { toxin: "Calcium channel blockers", antidote: "Calcium + High-dose insulin", dose: "Calcium gluconate 3g IV" },
  { toxin: "Digoxin", antidote: "Digoxin Fab", dose: "Based on serum level or empiric" },
  { toxin: "Methanol/Ethylene glycol", antidote: "Fomepizole or Ethanol", dose: "Fomepizole 15mg/kg IV" },
  { toxin: "Iron", antidote: "Deferoxamine", dose: "15mg/kg/hr IV infusion" },
  { toxin: "Tricyclic antidepressants", antidote: "Sodium Bicarbonate", dose: "1-2 mEq/kg IV boluses" },
];

const MENTAL_HEALTH_ASSESSMENT = [
  "Current suicidal ideation",
  "Suicide plan",
  "Intent to die from this ingestion",
  "Previous suicide attempts",
  "Psychiatric history",
  "Substance use disorder",
  "Social stressors identified",
  "Protective factors present",
];

export function PoisoningWorkspace() {
  const [currentPhase, setCurrentPhase] = useState<"stabilization" | "exposure" | "investigations" | "treatment" | "monitoring" | "outcome">("stabilization");
  const [selectedToxidrome, setSelectedToxidrome] = useState<string | null>(null);
  const [vitalsLog, setVitalsLog] = useState<VitalEntry[]>([]);
  const [selectedAntidotes, setSelectedAntidotes] = useState<string[]>([]);
  const [mentalHealthFlags, setMentalHealthFlags] = useState<string[]>([]);
  const [intentionality, setIntentionality] = useState<"accidental" | "intentional" | "unknown">("unknown");

  const addVitalsEntry = () => {
    const newEntry: VitalEntry = {
      time: new Date().toLocaleTimeString(),
      gcs: 15,
      hr: 0,
      bp: "",
      rr: 0,
      spo2: 0,
      temp: 0,
      glucose: 0,
      pupils: "",
    };
    setVitalsLog(prev => [...prev, newEntry]);
  };

  const toggleAntidote = (toxin: string) => {
    setSelectedAntidotes(prev => 
      prev.includes(toxin) ? prev.filter(a => a !== toxin) : [...prev, toxin]
    );
  };

  const toggleMentalHealthFlag = (flag: string) => {
    setMentalHealthFlags(prev => 
      prev.includes(flag) ? prev.filter(f => f !== flag) : [...prev, flag]
    );
  };

  const phases = [
    { id: "stabilization", label: "Stabilization" },
    { id: "exposure", label: "Exposure Hx" },
    { id: "investigations", label: "Investigations" },
    { id: "treatment", label: "Treatment" },
    { id: "monitoring", label: "Monitoring" },
    { id: "outcome", label: "Outcome" },
  ];

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      <Card className="border-2 border-warning bg-warning/5">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skull className="w-5 h-5 text-warning" />
              <span className="font-medium">Poisoning / Overdose Management</span>
              <Badge variant={intentionality === "intentional" ? "destructive" : "outline"}>
                {intentionality.charAt(0).toUpperCase() + intentionality.slice(1)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">Poison Control: Call for guidance</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
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

      {/* Stabilization Phase */}
      {currentPhase === "stabilization" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="w-5 h-5 text-destructive" />
                ABC Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { letter: "A", label: "Airway", checks: ["Patent", "Protected", "Intubation needed"] },
                { letter: "B", label: "Breathing", checks: ["Adequate RR", "SpO2 adequate", "Supplemental O2"] },
                { letter: "C", label: "Circulation", checks: ["Pulse present", "BP adequate", "IV access"] },
                { letter: "D", label: "Disability", checks: ["GCS assessed", "Pupils checked", "Glucose checked"] },
                { letter: "E", label: "Exposure", checks: ["Temperature", "Skin exam", "Decontamination considered"] },
              ].map((item) => (
                <div key={item.letter} className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="font-bold">{item.letter}</Badge>
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.checks.map((check) => (
                      <div key={check} className="flex items-center gap-1">
                        <Checkbox className="h-3 w-3" />
                        <Label className="text-xs">{check}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Initial Vitals & GCS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">GCS</Label>
                  <Input placeholder="3-15" className="mt-1 h-8" />
                </div>
                <div>
                  <Label className="text-xs">HR</Label>
                  <Input placeholder="bpm" className="mt-1 h-8" />
                </div>
                <div>
                  <Label className="text-xs">BP</Label>
                  <Input placeholder="mmHg" className="mt-1 h-8" />
                </div>
                <div>
                  <Label className="text-xs">RR</Label>
                  <Input placeholder="/min" className="mt-1 h-8" />
                </div>
                <div>
                  <Label className="text-xs">SpO2</Label>
                  <Input placeholder="%" className="mt-1 h-8" />
                </div>
                <div>
                  <Label className="text-xs">Temp</Label>
                  <Input placeholder="°C" className="mt-1 h-8" />
                </div>
                <div>
                  <Label className="text-xs">Glucose</Label>
                  <Input placeholder="mmol/L" className="mt-1 h-8" />
                </div>
                <div>
                  <Label className="text-xs">Pupils</Label>
                  <Input placeholder="Size/React" className="mt-1 h-8" />
                </div>
              </div>

              <div>
                <Label className="text-sm">Toxidrome Identification</Label>
                <div className="grid gap-2 mt-2">
                  {COMMON_TOXIDROMES.map((toxidrome) => (
                    <div
                      key={toxidrome.name}
                      className={`p-2 border rounded cursor-pointer text-sm ${
                        selectedToxidrome === toxidrome.name ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => setSelectedToxidrome(toxidrome.name)}
                    >
                      <span className="font-medium">{toxidrome.name}</span>
                      <p className="text-xs text-muted-foreground">{toxidrome.signs}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="col-span-2 flex justify-end">
            <Button onClick={() => setCurrentPhase("exposure")}>
              Proceed to Exposure History
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Exposure History Phase */}
      {currentPhase === "exposure" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Beaker className="w-5 h-5 text-primary" />
                Exposure Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">Substance(s) Involved</Label>
                <Textarea placeholder="List all substances - drug names, household products, plants..." className="mt-1" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Route of Exposure</Label>
                  <select className="w-full mt-1 border rounded-lg p-2">
                    <option>Ingestion</option>
                    <option>Inhalation</option>
                    <option>Injection</option>
                    <option>Dermal/Ocular</option>
                    <option>Unknown</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm">Amount/Dose</Label>
                  <Input placeholder="Quantity if known" className="mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Time of Exposure</Label>
                  <Input type="datetime-local" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Time Since Exposure</Label>
                  <Input placeholder="Hours/minutes" className="mt-1" />
                </div>
              </div>

              <div>
                <Label className="text-sm">Intentionality</Label>
                <div className="flex gap-2 mt-2">
                  {["accidental", "intentional", "unknown"].map((intent) => (
                    <Badge
                      key={intent}
                      variant={intentionality === intent ? (intent === "intentional" ? "destructive" : "default") : "outline"}
                      className="cursor-pointer"
                      onClick={() => setIntentionality(intent as typeof intentionality)}
                    >
                      {intent.charAt(0).toUpperCase() + intent.slice(1)}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Relevant History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">Co-ingestants/Polysubstance</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Alcohol", "Opioids", "Benzodiazepines", "Stimulants", "Cannabis", "Unknown pills"].map((sub) => (
                    <Badge key={sub} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                      {sub}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm">Symptoms Since Exposure</Label>
                <Textarea placeholder="Nausea, vomiting, altered consciousness, seizures..." className="mt-1" />
              </div>

              <div>
                <Label className="text-sm">Medical History</Label>
                <Textarea placeholder="Chronic conditions, medications, allergies..." className="mt-1" />
              </div>

              <div>
                <Label className="text-sm">Source of Information</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Patient", "Family/Friend", "EMS", "Pill bottles", "Unknown"].map((source) => (
                    <Badge key={source} variant="outline" className="cursor-pointer">
                      {source}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="col-span-2 flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("stabilization")}>Back</Button>
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
                <Beaker className="w-5 h-5 text-primary" />
                Laboratory Investigations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { category: "Basic", tests: ["Glucose", "U&E", "Creatinine", "LFTs"] },
                { category: "Toxicology", tests: ["Paracetamol level", "Salicylate level", "Ethanol level", "Urine drug screen"] },
                { category: "Metabolic", tests: ["VBG/ABG", "Lactate", "Osmolar gap", "Anion gap"] },
                { category: "Other", tests: ["Coagulation", "CK", "Troponin", "Specific drug levels"] },
              ].map((group) => (
                <div key={group.category} className="p-3 border rounded-lg">
                  <p className="text-sm font-medium mb-2">{group.category}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.tests.map((test) => (
                      <div key={test} className="flex items-center gap-1">
                        <Checkbox className="h-3 w-3" />
                        <Label className="text-xs">{test}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                ECG & Imaging
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">12-Lead ECG</span>
                  <Checkbox />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <Label className="text-xs">Rate</Label>
                    <Input placeholder="bpm" className="h-7" />
                  </div>
                  <div>
                    <Label className="text-xs">QRS</Label>
                    <Input placeholder="ms" className="h-7" />
                  </div>
                  <div>
                    <Label className="text-xs">QTc</Label>
                    <Input placeholder="ms" className="h-7" />
                  </div>
                </div>
                <div className="mt-2">
                  <Label className="text-xs">ECG Findings</Label>
                  <Textarea placeholder="Rhythm, conduction, ST changes..." className="mt-1 h-16" />
                </div>
              </div>

              <div className="space-y-2">
                {["Chest X-ray", "Abdominal X-ray (iron/packets)", "CT Head (if AMS)", "CT Abdomen"].map((imaging) => (
                  <div key={imaging} className="flex items-center gap-3">
                    <Checkbox />
                    <Label className="text-sm">{imaging}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="col-span-2 flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("exposure")}>Back</Button>
            <Button onClick={() => setCurrentPhase("treatment")}>
              Proceed to Treatment
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Treatment Phase */}
      {currentPhase === "treatment" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Decontamination
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {DECONTAMINATION_OPTIONS.map((option) => (
                <div key={option.id} className="p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Checkbox />
                    <div>
                      <span className="font-medium text-sm">{option.label}</span>
                      <p className="text-xs text-muted-foreground">{option.indication}</p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                <div className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Contraindications</span>
                </div>
                <p className="text-xs mt-1">
                  Caustics, hydrocarbons, altered consciousness without airway protection, late presentation
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Beaker className="w-5 h-5 text-primary" />
                Antidotes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {COMMON_ANTIDOTES.map((item) => (
                  <div 
                    key={item.toxin}
                    className={`p-3 border rounded-lg cursor-pointer ${
                      selectedAntidotes.includes(item.toxin) ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => toggleAntidote(item.toxin)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox checked={selectedAntidotes.includes(item.toxin)} />
                      <div>
                        <span className="font-medium text-sm">{item.toxin}</span>
                        <p className="text-xs text-primary">{item.antidote}</p>
                        <p className="text-xs text-muted-foreground">{item.dose}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Supportive Care
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {[
                  "IV Fluids", "Vasopressors", "Intubation/Ventilation", "Cooling/Warming",
                  "Benzodiazepines (seizures)", "Anti-emetics", "Cardiac monitoring", "ICU admission"
                ].map((care) => (
                  <div key={care} className="flex items-center gap-2">
                    <Checkbox />
                    <Label className="text-sm">{care}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="col-span-2 flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("investigations")}>Back</Button>
            <Button onClick={() => setCurrentPhase("monitoring")}>
              Proceed to Monitoring
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Monitoring Phase */}
      {currentPhase === "monitoring" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Observation Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {vitalsLog.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No observations recorded yet
                  </p>
                ) : (
                  vitalsLog.map((entry, idx) => (
                    <div key={idx} className="p-2 bg-muted/50 rounded text-xs grid grid-cols-4 gap-2">
                      <span>{entry.time}</span>
                      <span>GCS: {entry.gcs}</span>
                      <span>HR: {entry.hr}</span>
                      <span>BP: {entry.bp}</span>
                    </div>
                  ))
                )}
              </div>
              <Button size="sm" className="w-full mt-4" onClick={addVitalsEntry}>
                <Plus className="w-4 h-4 mr-1" />
                Add Observation
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Mental Health Assessment
                {intentionality === "intentional" && (
                  <Badge variant="destructive" className="ml-2">Required</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {MENTAL_HEALTH_ASSESSMENT.map((item) => (
                <div 
                  key={item}
                  className={`flex items-center gap-3 p-2 rounded ${
                    mentalHealthFlags.includes(item) ? "bg-destructive/10 border border-destructive/30" : ""
                  }`}
                >
                  <Checkbox
                    checked={mentalHealthFlags.includes(item)}
                    onCheckedChange={() => toggleMentalHealthFlag(item)}
                  />
                  <Label className="text-sm cursor-pointer">{item}</Label>
                </div>
              ))}

              {mentalHealthFlags.length > 2 && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">Psychiatry Consultation Required</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Progress Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="Document clinical progress, response to treatment, serial exams..."
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>

          <div className="col-span-2 flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("treatment")}>Back</Button>
            <Button onClick={() => setCurrentPhase("outcome")}>
              Proceed to Outcome
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Outcome Phase */}
      {currentPhase === "outcome" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Disposition
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">Outcome</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    "Discharge home",
                    "Admit - General Ward",
                    "Admit - HDU",
                    "Admit - ICU",
                    "Transfer",
                    "Psychiatry admission",
                    "Death",
                  ].map((outcome) => (
                    <Badge key={outcome} variant="outline" className="cursor-pointer justify-center py-2 hover:bg-primary hover:text-primary-foreground">
                      {outcome}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm">Observation Duration</Label>
                <Input placeholder="Hours observed" className="mt-1" />
              </div>

              <div>
                <Label className="text-sm">Discharge Criteria Met</Label>
                <div className="space-y-2 mt-2">
                  {[
                    "Medically stable",
                    "Mental health clearance (if intentional)",
                    "Safe disposition plan",
                    "Follow-up arranged",
                  ].map((criteria) => (
                    <div key={criteria} className="flex items-center gap-2">
                      <Checkbox />
                      <Label className="text-sm">{criteria}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Follow-Up Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {[
                  "Poison control notification completed",
                  "Psychiatry follow-up (if intentional)",
                  "Primary care follow-up",
                  "Substance use counseling referral",
                  "Social work referral",
                  "Patient education provided",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <Checkbox />
                    <Label className="text-sm">{item}</Label>
                  </div>
                ))}
              </div>

              <div>
                <Label className="text-sm">Discharge Instructions</Label>
                <Textarea placeholder="Return precautions, medication instructions, follow-up appointments..." className="mt-1" />
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Case Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center mb-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold">{selectedToxidrome || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">Toxidrome</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold">{selectedAntidotes.length}</p>
                  <p className="text-xs text-muted-foreground">Antidotes Given</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold">{vitalsLog.length}</p>
                  <p className="text-xs text-muted-foreground">Observations</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold capitalize">{intentionality}</p>
                  <p className="text-xs text-muted-foreground">Intentionality</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Print Summary</Button>
                <Button>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Case
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
