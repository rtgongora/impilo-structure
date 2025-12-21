import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Baby, AlertTriangle, Clock, Activity, Plus, 
  ChevronRight, CheckCircle, Heart, Wind, Timer,
  Syringe, Thermometer, FileText
} from "lucide-react";
import { useState, useEffect } from "react";

interface ResusAction {
  time: string;
  elapsed: number;
  action: string;
  details?: string;
}

interface ApgarScore {
  minute: 1 | 5 | 10;
  appearance: 0 | 1 | 2;
  pulse: 0 | 1 | 2;
  grimace: 0 | 1 | 2;
  activity: 0 | 1 | 2;
  respiration: 0 | 1 | 2;
  total: number;
}

const RISK_FACTORS = [
  "Prematurity (<37 weeks)", "Meconium-stained liquor", "Multiple gestation",
  "Prolonged rupture of membranes", "Maternal infection/fever", "Abnormal CTG",
  "Emergency C-section", "Cord prolapse", "Placental abruption", "Shoulder dystocia"
];

const RESUS_STEPS = [
  { id: "dry", label: "Dry and stimulate", category: "Initial" },
  { id: "warmth", label: "Maintain warmth", category: "Initial" },
  { id: "position", label: "Position airway", category: "Initial" },
  { id: "suction", label: "Suction if needed", category: "Airway" },
  { id: "bmv", label: "Bag-mask ventilation", category: "Breathing" },
  { id: "peep", label: "PEEP/CPAP applied", category: "Breathing" },
  { id: "intubation", label: "Intubation", category: "Breathing" },
  { id: "surfactant", label: "Surfactant given", category: "Breathing" },
  { id: "compressions", label: "Chest compressions (3:1)", category: "Circulation" },
  { id: "adrenaline", label: "Adrenaline", category: "Medications" },
  { id: "volume", label: "Volume expansion", category: "Medications" },
  { id: "glucose", label: "Glucose given", category: "Medications" },
];

const APGAR_CRITERIA = {
  appearance: [
    { score: 0, label: "Blue/Pale" },
    { score: 1, label: "Acrocyanosis" },
    { score: 2, label: "Pink" },
  ],
  pulse: [
    { score: 0, label: "Absent" },
    { score: 1, label: "<100 bpm" },
    { score: 2, label: "≥100 bpm" },
  ],
  grimace: [
    { score: 0, label: "None" },
    { score: 1, label: "Grimace" },
    { score: 2, label: "Cry/Cough" },
  ],
  activity: [
    { score: 0, label: "Limp" },
    { score: 1, label: "Some flexion" },
    { score: 2, label: "Active" },
  ],
  respiration: [
    { score: 0, label: "Absent" },
    { score: 1, label: "Weak/Irregular" },
    { score: 2, label: "Good cry" },
  ],
};

export function NeonatalResusWorkspace() {
  const [currentPhase, setCurrentPhase] = useState<"birth" | "resus" | "apgar" | "outcome">("birth");
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [actions, setActions] = useState<ResusAction[]>([]);
  const [selectedRisks, setSelectedRisks] = useState<string[]>([]);
  const [apgarScores, setApgarScores] = useState<ApgarScore[]>([]);
  const [resusStarted, setResusStarted] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resusStarted && startTime) {
      interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resusStarted, startTime]);

  const startResus = () => {
    setStartTime(new Date());
    setResusStarted(true);
    setCurrentPhase("resus");
    addAction("Resuscitation started");
  };

  const addAction = (action: string, details?: string) => {
    setActions(prev => [...prev, {
      time: new Date().toLocaleTimeString(),
      elapsed: elapsedSeconds,
      action,
      details
    }]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateApgar = (scores: Partial<ApgarScore>): number => {
    return (scores.appearance || 0) + (scores.pulse || 0) + (scores.grimace || 0) + 
           (scores.activity || 0) + (scores.respiration || 0);
  };

  const addApgarScore = (minute: 1 | 5 | 10) => {
    const existingIndex = apgarScores.findIndex(s => s.minute === minute);
    if (existingIndex === -1) {
      setApgarScores(prev => [...prev, {
        minute,
        appearance: 0,
        pulse: 0,
        grimace: 0,
        activity: 0,
        respiration: 0,
        total: 0
      }]);
    }
  };

  const updateApgarComponent = (minute: 1 | 5 | 10, component: keyof Omit<ApgarScore, 'minute' | 'total'>, value: 0 | 1 | 2) => {
    setApgarScores(prev => prev.map(score => {
      if (score.minute === minute) {
        const updated = { ...score, [component]: value };
        updated.total = calculateApgar(updated);
        return updated;
      }
      return score;
    }));
  };

  const toggleRisk = (risk: string) => {
    setSelectedRisks(prev => 
      prev.includes(risk) ? prev.filter(r => r !== risk) : [...prev, risk]
    );
  };

  const phases = [
    { id: "birth", label: "Birth Details" },
    { id: "resus", label: "Resuscitation" },
    { id: "apgar", label: "APGAR Scores" },
    { id: "outcome", label: "Outcome" },
  ];

  return (
    <div className="space-y-6">
      {/* Timer Banner */}
      {resusStarted && (
        <Card className="border-2 border-destructive bg-destructive/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Baby className="w-6 h-6 text-destructive animate-pulse" />
                <span className="font-bold text-lg">NEONATAL RESUSCITATION ACTIVE</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Elapsed Time</p>
                  <p className="text-3xl font-mono font-bold text-destructive">{formatTime(elapsedSeconds)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Actions</p>
                  <p className="text-2xl font-bold">{actions.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Birth Details Phase */}
      {currentPhase === "birth" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Baby className="w-5 h-5 text-primary" />
                Birth Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Time of Birth</Label>
                  <Input type="time" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Date</Label>
                  <Input type="date" className="mt-1" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Gestational Age (weeks)</Label>
                  <Input type="number" placeholder="40" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Birth Weight (g)</Label>
                  <Input type="number" placeholder="3500" className="mt-1" />
                </div>
              </div>

              <div>
                <Label className="text-sm">Mode of Delivery</Label>
                <select className="w-full mt-1 border rounded-lg p-2">
                  <option>SVD</option>
                  <option>Vacuum</option>
                  <option>Forceps</option>
                  <option>Emergency C-Section</option>
                  <option>Elective C-Section</option>
                </select>
              </div>

              <div>
                <Label className="text-sm">Presentation</Label>
                <select className="w-full mt-1 border rounded-lg p-2">
                  <option>Cephalic</option>
                  <option>Breech</option>
                  <option>Transverse</option>
                </select>
              </div>

              <div>
                <Label className="text-sm">Sex</Label>
                <div className="flex gap-2 mt-1">
                  {["Male", "Female", "Ambiguous"].map((sex) => (
                    <Badge key={sex} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                      {sex}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Risk Factors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {RISK_FACTORS.map((risk) => (
                  <div 
                    key={risk}
                    className={`flex items-center gap-3 p-2 rounded ${
                      selectedRisks.includes(risk) ? "bg-warning/10 border border-warning/30" : ""
                    }`}
                  >
                    <Checkbox
                      checked={selectedRisks.includes(risk)}
                      onCheckedChange={() => toggleRisk(risk)}
                    />
                    <Label className="text-sm cursor-pointer">{risk}</Label>
                  </div>
                ))}
              </div>

              {selectedRisks.length > 0 && (
                <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                  <p className="text-sm font-medium text-warning">
                    {selectedRisks.length} risk factor(s) - Resuscitation team should be present
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Initial Assessment at Birth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm">Tone</Label>
                  <select className="w-full mt-1 border rounded-lg p-2">
                    <option>Good</option>
                    <option>Reduced</option>
                    <option>Floppy</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm">Breathing</Label>
                  <select className="w-full mt-1 border rounded-lg p-2">
                    <option>Crying</option>
                    <option>Gasping</option>
                    <option>Apnoeic</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm">Color</Label>
                  <select className="w-full mt-1 border rounded-lg p-2">
                    <option>Pink</option>
                    <option>Acrocyanosis</option>
                    <option>Pale/Blue</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm">Heart Rate</Label>
                  <select className="w-full mt-1 border rounded-lg p-2">
                    <option>≥100 bpm</option>
                    <option>60-100 bpm</option>
                    <option>&lt;60 bpm</option>
                    <option>Absent</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-center mt-6">
                <Button size="lg" className="bg-destructive hover:bg-destructive/90" onClick={startResus}>
                  <Baby className="w-5 h-5 mr-2" />
                  Start Resuscitation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resuscitation Phase */}
      {currentPhase === "resus" && (
        <div className="grid grid-cols-3 gap-6">
          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wind className="w-5 h-5 text-primary" />
                Resuscitation Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {["Initial", "Airway", "Breathing", "Circulation", "Medications"].map((category) => (
                  <div key={category} className="space-y-2">
                    <p className="text-sm font-medium text-primary">{category}</p>
                    {RESUS_STEPS.filter(s => s.category === category).map((step) => (
                      <Button
                        key={step.id}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => addAction(step.label)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {step.label}
                      </Button>
                    ))}
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex gap-2">
                  <Input placeholder="Custom action..." className="flex-1" id="customAction" />
                  <Button onClick={() => {
                    const input = document.getElementById('customAction') as HTMLInputElement;
                    if (input.value) {
                      addAction(input.value);
                      input.value = '';
                    }
                  }}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Action Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {actions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No actions recorded
                  </p>
                ) : (
                  actions.map((action, idx) => (
                    <div key={idx} className="p-2 bg-muted/50 rounded text-sm">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="font-mono text-xs">
                          {formatTime(action.elapsed)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{action.time}</span>
                      </div>
                      <p className="mt-1 font-medium">{action.action}</p>
                      {action.details && <p className="text-xs text-muted-foreground">{action.details}</p>}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Quick Vitals Check
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4">
                <div>
                  <Label className="text-xs">HR (bpm)</Label>
                  <Input placeholder="140" className="h-8" />
                </div>
                <div>
                  <Label className="text-xs">SpO2 (%)</Label>
                  <Input placeholder="95" className="h-8" />
                </div>
                <div>
                  <Label className="text-xs">Temp (°C)</Label>
                  <Input placeholder="36.5" className="h-8" />
                </div>
                <div>
                  <Label className="text-xs">Glucose</Label>
                  <Input placeholder="mmol/L" className="h-8" />
                </div>
                <div className="flex items-end">
                  <Button size="sm" className="w-full" onClick={() => addAction("Vitals recorded")}>
                    Record
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="col-span-3 flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("birth")}>Back</Button>
            <Button onClick={() => {
              setCurrentPhase("apgar");
              addApgarScore(1);
              addApgarScore(5);
            }}>
              Record APGAR Scores
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* APGAR Phase */}
      {currentPhase === "apgar" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                APGAR Scores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                {[1, 5, 10].map((minute) => {
                  const score = apgarScores.find(s => s.minute === minute);
                  const isActive = score !== undefined;

                  return (
                    <div key={minute} className={`p-4 border rounded-lg ${isActive ? "" : "opacity-50"}`}>
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant={isActive ? "default" : "outline"} className="text-lg px-3 py-1">
                          {minute} min
                        </Badge>
                        {!isActive && (
                          <Button size="sm" variant="outline" onClick={() => addApgarScore(minute as 1 | 5 | 10)}>
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                          </Button>
                        )}
                        {isActive && (
                          <Badge variant={score!.total >= 7 ? "default" : score!.total >= 4 ? "secondary" : "destructive"} className="text-lg px-3 py-1">
                            {score!.total}/10
                          </Badge>
                        )}
                      </div>

                      {isActive && (
                        <div className="space-y-3">
                          {(Object.keys(APGAR_CRITERIA) as Array<keyof typeof APGAR_CRITERIA>).map((component) => (
                            <div key={component} className="space-y-1">
                              <Label className="text-xs capitalize">{component}</Label>
                              <div className="flex gap-1">
                                {APGAR_CRITERIA[component].map((option) => (
                                  <Button
                                    key={option.score}
                                    size="sm"
                                    variant={score![component] === option.score ? "default" : "outline"}
                                    className="flex-1 text-xs h-7"
                                    onClick={() => updateApgarComponent(minute as 1 | 5 | 10, component, option.score as 0 | 1 | 2)}
                                  >
                                    {option.score}
                                  </Button>
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground text-center">
                                {APGAR_CRITERIA[component].find(o => o.score === score![component])?.label}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* APGAR Legend */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-5 gap-4 text-xs">
                  <div><span className="font-bold">A</span>ppearance (Color)</div>
                  <div><span className="font-bold">P</span>ulse (Heart Rate)</div>
                  <div><span className="font-bold">G</span>rimace (Reflex)</div>
                  <div><span className="font-bold">A</span>ctivity (Tone)</div>
                  <div><span className="font-bold">R</span>espiration</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("resus")}>Back</Button>
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
                Resuscitation Outcome
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">Outcome</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { id: "rosc", label: "ROSC / Stable", variant: "default" as const },
                    { id: "nicu", label: "NICU Admission", variant: "secondary" as const },
                    { id: "death", label: "Neonatal Death", variant: "destructive" as const },
                    { id: "mother", label: "With Mother (Well)", variant: "default" as const },
                  ].map((outcome) => (
                    <Badge 
                      key={outcome.id} 
                      variant="outline" 
                      className="cursor-pointer justify-center py-3 hover:bg-primary hover:text-primary-foreground"
                    >
                      {outcome.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Time of ROSC</Label>
                  <Input type="time" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Total Resus Duration</Label>
                  <Input value={formatTime(elapsedSeconds)} readOnly className="mt-1 bg-muted" />
                </div>
              </div>

              <div>
                <Label className="text-sm">Interventions Summary</Label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {[...new Set(actions.map(a => a.action))].map((action) => (
                    <Badge key={action} variant="secondary" className="text-xs">
                      {action}
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
                Post-Resuscitation Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">Monitoring Level</Label>
                <select className="w-full mt-1 border rounded-lg p-2">
                  <option>Standard postnatal</option>
                  <option>Enhanced observation</option>
                  <option>Special Care Baby Unit</option>
                  <option>Neonatal ICU</option>
                </select>
              </div>

              <div className="space-y-2">
                {[
                  "Blood gas obtained",
                  "Blood glucose monitoring",
                  "Temperature management",
                  "Therapeutic hypothermia considered",
                  "Senior review completed",
                  "Parents updated",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <Checkbox />
                    <Label className="text-sm">{item}</Label>
                  </div>
                ))}
              </div>

              <div>
                <Label className="text-sm">Notes</Label>
                <Textarea placeholder="Post-resuscitation care notes..." className="mt-1" />
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4 text-center mb-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{formatTime(elapsedSeconds)}</p>
                  <p className="text-xs text-muted-foreground">Duration</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{actions.length}</p>
                  <p className="text-xs text-muted-foreground">Actions</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{apgarScores.find(s => s.minute === 1)?.total ?? '-'}</p>
                  <p className="text-xs text-muted-foreground">APGAR 1min</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{apgarScores.find(s => s.minute === 5)?.total ?? '-'}</p>
                  <p className="text-xs text-muted-foreground">APGAR 5min</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{selectedRisks.length}</p>
                  <p className="text-xs text-muted-foreground">Risk Factors</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Print Summary</Button>
                <Button>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Record
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
