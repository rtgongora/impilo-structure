import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  Pill, AlertTriangle, Clock, User, Activity, Plus, 
  ChevronRight, Droplets, ThermometerIcon, TrendingUp, CheckCircle,
  Syringe, FileText, Beaker, Shield, Heart, Calendar, BarChart3,
  CircleAlert, Timer
} from "lucide-react";
import { useState } from "react";

interface DrugDose {
  drug: string;
  dose: string;
  route: string;
  duration: string;
  day: number;
  status: "pending" | "infusing" | "completed" | "held" | "omitted";
}

interface ToxicityGrade {
  system: string;
  grade: 0 | 1 | 2 | 3 | 4;
  description: string;
  date: string;
}

const COMMON_REGIMENS = [
  { code: "FOLFOX", name: "FOLFOX (Colorectal)", drugs: ["5-FU", "Leucovorin", "Oxaliplatin"], cycles: 12 },
  { code: "AC-T", name: "AC-T (Breast)", drugs: ["Doxorubicin", "Cyclophosphamide", "Paclitaxel"], cycles: 8 },
  { code: "R-CHOP", name: "R-CHOP (Lymphoma)", drugs: ["Rituximab", "Cyclophosphamide", "Doxorubicin", "Vincristine", "Prednisone"], cycles: 6 },
  { code: "BEP", name: "BEP (Testicular)", drugs: ["Bleomycin", "Etoposide", "Cisplatin"], cycles: 4 },
  { code: "ABVD", name: "ABVD (Hodgkin)", drugs: ["Doxorubicin", "Bleomycin", "Vinblastine", "Dacarbazine"], cycles: 6 },
  { code: "TC", name: "TC (Breast)", drugs: ["Docetaxel", "Cyclophosphamide"], cycles: 4 },
];

const TOXICITY_SYSTEMS = [
  "Hematologic", "Gastrointestinal", "Dermatologic", "Neurologic", 
  "Cardiac", "Renal", "Hepatic", "Pulmonary", "Constitutional"
];

const PRE_CHEMO_CHECKLIST = [
  { id: "consent", label: "Informed consent signed" },
  { id: "labs", label: "Labs reviewed (within 72h)" },
  { id: "anc", label: "ANC > 1500 (or as per protocol)" },
  { id: "platelets", label: "Platelets adequate" },
  { id: "renal", label: "Renal function adequate" },
  { id: "hepatic", label: "Hepatic function adequate" },
  { id: "weight", label: "Weight recorded" },
  { id: "bsa", label: "BSA calculated" },
  { id: "allergies", label: "Allergies confirmed" },
  { id: "access", label: "IV access confirmed" },
  { id: "premeds", label: "Pre-medications ordered" },
  { id: "hydration", label: "Hydration plan reviewed" },
];

export function ChemotherapyWorkspace() {
  const [currentPhase, setCurrentPhase] = useState<"planning" | "precheck" | "infusion" | "monitoring">("planning");
  const [selectedRegimen, setSelectedRegimen] = useState<string | null>(null);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [toxicities, setToxicities] = useState<ToxicityGrade[]>([]);
  const [infusionDrugs, setInfusionDrugs] = useState<DrugDose[]>([]);

  const regimen = COMMON_REGIMENS.find(r => r.code === selectedRegimen);

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const startInfusion = () => {
    if (regimen) {
      setInfusionDrugs(regimen.drugs.map((drug, idx) => ({
        drug,
        dose: "Calculated dose",
        route: "IV",
        duration: "60 min",
        day: 1,
        status: idx === 0 ? "infusing" : "pending"
      })));
      setCurrentPhase("infusion");
    }
  };

  const addToxicity = (system: string, grade: 0 | 1 | 2 | 3 | 4) => {
    setToxicities(prev => [...prev, {
      system,
      grade,
      description: "",
      date: new Date().toISOString().split('T')[0]
    }]);
  };

  const phases = [
    { id: "planning", label: "Planning" },
    { id: "precheck", label: "Pre-Chemo Check" },
    { id: "infusion", label: "Infusion" },
    { id: "monitoring", label: "Monitoring" },
  ];

  return (
    <div className="space-y-6">
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

      {/* Cycle Status Banner */}
      {regimen && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="default" className="text-sm">
                  {regimen.code}
                </Badge>
                <span className="text-sm font-medium">{regimen.name}</span>
                <Badge variant="outline">
                  Cycle {currentCycle} of {regimen.cycles}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Cycle Progress:</span>
                <Progress value={(currentCycle / regimen.cycles) * 100} className="w-32 h-2" />
                <span className="text-sm font-medium">{Math.round((currentCycle / regimen.cycles) * 100)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Planning Phase */}
      {currentPhase === "planning" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Beaker className="w-5 h-5 text-primary" />
                Regimen Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {COMMON_REGIMENS.map((reg) => (
                  <div
                    key={reg.code}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedRegimen === reg.code 
                        ? "border-primary bg-primary/5" 
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedRegimen(reg.code)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{reg.code}</span>
                        <p className="text-sm text-muted-foreground">{reg.name}</p>
                      </div>
                      <Badge variant="outline">{reg.cycles} cycles</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {reg.drugs.map(drug => (
                        <Badge key={drug} variant="secondary" className="text-xs">
                          {drug}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Dosing Parameters
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
                  <Label className="text-sm">BSA (m²)</Label>
                  <Input value="1.82" readOnly className="mt-1 bg-muted" />
                </div>
                <div>
                  <Label className="text-sm">Dose Reduction (%)</Label>
                  <Input type="number" placeholder="0" className="mt-1" />
                </div>
              </div>

              <div>
                <Label className="text-sm">Cycle Start Date</Label>
                <Input type="date" className="mt-1" />
              </div>

              <div>
                <Label className="text-sm">Cycle Interval (days)</Label>
                <Input type="number" placeholder="21" className="mt-1" />
              </div>

              <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                <div className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Dose Calculations</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  All doses will be calculated based on BSA and verified by pharmacy before administration.
                </p>
              </div>

              <Button className="w-full" onClick={() => setCurrentPhase("precheck")} disabled={!selectedRegimen}>
                Proceed to Pre-Chemo Check
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Treatment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No previous cycles recorded</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pre-Chemo Check Phase */}
      {currentPhase === "precheck" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Safety Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {PRE_CHEMO_CHECKLIST.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <Checkbox
                    id={item.id}
                    checked={checkedItems.includes(item.id)}
                    onCheckedChange={() => toggleCheck(item.id)}
                  />
                  <Label htmlFor={item.id} className="text-sm cursor-pointer">
                    {item.label}
                  </Label>
                </div>
              ))}
              <div className="pt-4">
                <Progress 
                  value={(checkedItems.length / PRE_CHEMO_CHECKLIST.length) * 100} 
                  className="h-2" 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {checkedItems.length} of {PRE_CHEMO_CHECKLIST.length} items completed
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Pre-Treatment Labs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">WBC</span>
                    <Badge variant="default">8.2</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Normal: 4.5-11.0</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">ANC</span>
                    <Badge variant="default">4.5</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Min: 1.5</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Platelets</span>
                    <Badge variant="default">185</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Normal: 150-400</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Hgb</span>
                    <Badge variant="default">12.5</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Normal: 12.0-16.0</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Creatinine</span>
                    <Badge variant="default">0.9</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Normal: 0.7-1.2</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">ALT</span>
                    <Badge variant="default">28</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Normal: 7-56</p>
                </div>
              </div>

              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Labs Clear for Treatment</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Syringe className="w-5 h-5 text-primary" />
                Pre-Medications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { drug: "Ondansetron", dose: "8mg IV", timing: "30 min prior" },
                  { drug: "Dexamethasone", dose: "12mg IV", timing: "30 min prior" },
                  { drug: "Diphenhydramine", dose: "25mg IV", timing: "30 min prior" },
                  { drug: "Famotidine", dose: "20mg IV", timing: "30 min prior" },
                ].map((med, idx) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{med.drug}</span>
                      <Checkbox />
                    </div>
                    <p className="text-xs text-muted-foreground">{med.dose}</p>
                    <p className="text-xs text-primary">{med.timing}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="col-span-2 flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("planning")}>Back</Button>
            <Button 
              onClick={startInfusion} 
              disabled={checkedItems.length < PRE_CHEMO_CHECKLIST.length}
            >
              Begin Infusion
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Infusion Phase */}
      {currentPhase === "infusion" && (
        <div className="grid grid-cols-3 gap-6">
          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Droplets className="w-5 h-5 text-primary" />
                Infusion Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {infusionDrugs.map((drug, idx) => (
                <div key={idx} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{drug.drug}</span>
                      <Badge variant="outline">{drug.dose}</Badge>
                      <Badge variant="secondary">{drug.route}</Badge>
                    </div>
                    <Badge 
                      variant={
                        drug.status === "completed" ? "default" : 
                        drug.status === "infusing" ? "destructive" : 
                        "outline"
                      }
                    >
                      {drug.status === "infusing" && <Timer className="w-3 h-3 mr-1 animate-pulse" />}
                      {drug.status}
                    </Badge>
                  </div>
                  {drug.status === "infusing" && (
                    <div>
                      <Progress value={45} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>27 min elapsed</span>
                        <span>{drug.duration}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline">Hold</Button>
                    <Button size="sm" variant="outline">Pause</Button>
                    {drug.status === "infusing" && (
                      <Button size="sm" onClick={() => {
                        setInfusionDrugs(prev => prev.map((d, i) => ({
                          ...d,
                          status: i === idx ? "completed" : i === idx + 1 ? "infusing" : d.status
                        })));
                      }}>
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Vitals Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 border rounded text-center">
                    <p className="text-xs text-muted-foreground">BP</p>
                    <p className="font-medium">128/82</p>
                  </div>
                  <div className="p-2 border rounded text-center">
                    <p className="text-xs text-muted-foreground">HR</p>
                    <p className="font-medium">78</p>
                  </div>
                  <div className="p-2 border rounded text-center">
                    <p className="text-xs text-muted-foreground">Temp</p>
                    <p className="font-medium">36.8°C</p>
                  </div>
                  <div className="p-2 border rounded text-center">
                    <p className="text-xs text-muted-foreground">SpO2</p>
                    <p className="font-medium">98%</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-1" />
                  Record Vitals
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CircleAlert className="w-5 h-5 text-warning" />
                  Reactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {["Rash/Urticaria", "Dyspnea", "Hypotension", "Nausea", "Pain at site", "Other"].map((reaction) => (
                    <Badge key={reaction} variant="outline" className="mr-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground">
                      {reaction}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-3 flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("precheck")}>Back</Button>
            <Button onClick={() => setCurrentPhase("monitoring")}>
              Complete Infusion
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
                <AlertTriangle className="w-5 h-5 text-warning" />
                Toxicity Assessment (CTCAE v5.0)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {TOXICITY_SYSTEMS.map((system) => (
                  <div key={system} className="p-2 border rounded-lg">
                    <p className="text-xs font-medium mb-2">{system}</p>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map((grade) => (
                        <Button
                          key={grade}
                          size="sm"
                          variant={grade === 0 ? "outline" : grade <= 2 ? "secondary" : "destructive"}
                          className="w-6 h-6 p-0 text-xs"
                          onClick={() => addToxicity(system, grade as 0 | 1 | 2 | 3 | 4)}
                        >
                          {grade}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {toxicities.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Recorded Toxicities:</p>
                  {toxicities.map((tox, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-sm">{tox.system}</span>
                      <Badge variant={tox.grade >= 3 ? "destructive" : "secondary"}>
                        Grade {tox.grade}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Post-Infusion Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {[
                  { label: "Anti-emetics PRN", checked: true },
                  { label: "Growth factor (G-CSF)", checked: false },
                  { label: "Hydration", checked: true },
                  { label: "Labs in 7 days", checked: true },
                  { label: "Patient education provided", checked: false },
                ].map((order, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <Checkbox defaultChecked={order.checked} />
                    <Label className="text-sm">{order.label}</Label>
                  </div>
                ))}
              </div>

              <div>
                <Label className="text-sm">Follow-up Appointment</Label>
                <Input type="date" className="mt-1" />
              </div>

              <div>
                <Label className="text-sm">Notes</Label>
                <Textarea placeholder="Any observations, patient concerns, or instructions..." className="mt-1" />
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Cycle Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{currentCycle}</p>
                  <p className="text-xs text-muted-foreground">Current Cycle</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{infusionDrugs.length}</p>
                  <p className="text-xs text-muted-foreground">Drugs Given</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">Reactions</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{toxicities.filter(t => t.grade >= 3).length}</p>
                  <p className="text-xs text-muted-foreground">Grade 3+ Toxicities</p>
                </div>
              </div>

              <div className="flex justify-end mt-4 gap-2">
                <Button variant="outline">Save & Exit</Button>
                <Button onClick={() => {
                  setCurrentCycle(prev => prev + 1);
                  setCurrentPhase("planning");
                  setCheckedItems([]);
                  setToxicities([]);
                  setInfusionDrugs([]);
                }}>
                  Complete Cycle & Schedule Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
