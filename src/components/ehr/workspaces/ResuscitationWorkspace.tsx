import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Heart, Clock, User, Users, Zap, Activity, Plus, 
  ChevronRight, Syringe, FileText, AlertTriangle, Play,
  Pause, RotateCcw, CheckCircle, XCircle
} from "lucide-react";
import { useState, useEffect } from "react";

interface CPRCycle {
  id: string;
  cycleNumber: number;
  startTime: string;
  endTime?: string;
  compressor: string;
  quality: "good" | "fair" | "poor";
}

interface Defibrillation {
  id: string;
  time: string;
  joules: number;
  shockNumber: number;
  rhythm: string;
  outcome: string;
}

interface Medication {
  id: string;
  time: string;
  drug: string;
  dose: string;
  route: string;
  givenBy: string;
}

const RESUS_DRUGS = [
  { drug: "Adrenaline", dose: "1mg", route: "IV/IO" },
  { drug: "Amiodarone", dose: "300mg", route: "IV" },
  { drug: "Amiodarone", dose: "150mg", route: "IV" },
  { drug: "Atropine", dose: "3mg", route: "IV" },
  { drug: "Calcium Chloride", dose: "10ml 10%", route: "IV" },
  { drug: "Sodium Bicarbonate", dose: "50ml 8.4%", route: "IV" },
  { drug: "Magnesium", dose: "2g", route: "IV" },
];

const RHYTHMS = ["VF", "Pulseless VT", "PEA", "Asystole", "Sinus Rhythm", "AF", "Other"];

const TEAM_ROLES = [
  { role: "Team Leader", required: true },
  { role: "Airway", required: true },
  { role: "Chest Compressions", required: true },
  { role: "IV/IO Access", required: true },
  { role: "Medications", required: true },
  { role: "Defibrillator", required: true },
  { role: "Documentation", required: true },
];

export function ResuscitationWorkspace() {
  const [currentPhase, setCurrentPhase] = useState<"activation" | "resus" | "postresus" | "summary">("activation");
  const [cprActive, setCprActive] = useState(false);
  const [cprTimer, setCprTimer] = useState(0);
  const [cycles, setCycles] = useState<CPRCycle[]>([]);
  const [defibrillations, setDefibrillations] = useState<Defibrillation[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [currentRhythm, setCurrentRhythm] = useState("");
  const [rosc, setRosc] = useState(false);

  // CPR Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (cprActive) {
      interval = setInterval(() => {
        setCprTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cprActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startCPR = () => {
    setCprActive(true);
    const newCycle: CPRCycle = {
      id: `CPR-${Date.now()}`,
      cycleNumber: cycles.length + 1,
      startTime: new Date().toLocaleTimeString(),
      compressor: "",
      quality: "good",
    };
    setCycles(prev => [...prev, newCycle]);
  };

  const pauseCPR = () => {
    setCprActive(false);
    if (cycles.length > 0) {
      setCycles(prev => 
        prev.map((c, idx) => 
          idx === prev.length - 1 ? { ...c, endTime: new Date().toLocaleTimeString() } : c
        )
      );
    }
  };

  const addDefibrillation = (joules: number) => {
    const newDefib: Defibrillation = {
      id: `DEFIB-${Date.now()}`,
      time: new Date().toLocaleTimeString(),
      joules,
      shockNumber: defibrillations.length + 1,
      rhythm: currentRhythm,
      outcome: "",
    };
    setDefibrillations(prev => [...prev, newDefib]);
  };

  const addMedication = (drug: string, dose: string, route: string) => {
    const newMed: Medication = {
      id: `MED-${Date.now()}`,
      time: new Date().toLocaleTimeString(),
      drug,
      dose,
      route,
      givenBy: "",
    };
    setMedications(prev => [...prev, newMed]);
  };

  const phases = [
    { id: "activation", label: "Activation" },
    { id: "resus", label: "Resuscitation" },
    { id: "postresus", label: "Post-ROSC / Termination" },
    { id: "summary", label: "Summary" },
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
              className={`whitespace-nowrap ${currentPhase === phase.id && phase.id === "resus" ? "bg-destructive" : ""}`}
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

      {/* Activation Phase */}
      {currentPhase === "activation" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3 bg-destructive/10 border-b">
              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Code Blue Activation
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Activation Time</Label>
                  <div className="mt-2 p-3 bg-muted rounded-lg font-mono text-lg">
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Location</Label>
                  <Input className="mt-2" placeholder="Ward / Room / Bed" />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Activated By</Label>
                <Input className="mt-2" placeholder="Name and role" />
              </div>

              <div>
                <Label className="text-sm font-medium">Witnessed Arrest?</Label>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="cursor-pointer hover:bg-success/20">Yes - Witnessed</Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-muted">No - Unwitnessed</Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Bystander CPR Started?</Label>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="cursor-pointer hover:bg-success/20">Yes</Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-muted">No</Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Initial Rhythm</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {RHYTHMS.map((rhythm) => (
                    <Badge 
                      key={rhythm} 
                      variant={currentRhythm === rhythm ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setCurrentRhythm(rhythm)}
                    >
                      {rhythm}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Resuscitation Team
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {TEAM_ROLES.map((member) => (
                <div key={member.role} className="flex items-center gap-3 p-2 border rounded-lg">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">{member.role}</Label>
                    <Input placeholder="Team member name" className="h-8 text-sm mt-1" />
                  </div>
                  {member.required && <Badge variant="outline" className="text-xs">Required</Badge>}
                </div>
              ))}
              <Button className="w-full mt-4 bg-destructive hover:bg-destructive/90" onClick={() => setCurrentPhase("resus")}>
                <Play className="w-4 h-4 mr-2" />
                Begin Resuscitation
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Resuscitation Phase */}
      {currentPhase === "resus" && (
        <div className="space-y-4">
          {/* CPR Timer and Controls */}
          <Card className={`${cprActive ? "border-destructive bg-destructive/5" : ""}`}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">CPR Timer</div>
                    <div className={`text-4xl font-mono font-bold ${cprActive ? "text-destructive animate-pulse" : ""}`}>
                      {formatTime(cprTimer)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Cycle</div>
                    <div className="text-2xl font-bold">{cycles.length}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Shocks</div>
                    <div className="text-2xl font-bold">{defibrillations.length}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Current Rhythm</div>
                    <Badge variant="secondary" className="text-lg px-3 py-1">{currentRhythm || "Unknown"}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!cprActive ? (
                    <Button size="lg" className="bg-destructive hover:bg-destructive/90" onClick={startCPR}>
                      <Play className="w-5 h-5 mr-2" />
                      Start CPR
                    </Button>
                  ) : (
                    <Button size="lg" variant="outline" onClick={pauseCPR}>
                      <Pause className="w-5 h-5 mr-2" />
                      Pause for Rhythm Check
                    </Button>
                  )}
                  <Button size="lg" variant="outline" onClick={() => setCprTimer(0)}>
                    <RotateCcw className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            {/* Defibrillation */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Defibrillation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {[150, 200, 360].map((joules) => (
                    <Button 
                      key={joules} 
                      variant="outline" 
                      className="h-12 font-bold"
                      onClick={() => addDefibrillation(joules)}
                    >
                      {joules}J
                    </Button>
                  ))}
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {defibrillations.map((defib) => (
                    <div key={defib.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                      <span>Shock #{defib.shockNumber}</span>
                      <span>{defib.joules}J</span>
                      <Badge variant="outline">{defib.time}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Medications */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Syringe className="w-5 h-5 text-primary" />
                  Medications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {RESUS_DRUGS.slice(0, 4).map((med, idx) => (
                    <Button 
                      key={idx} 
                      variant="outline" 
                      size="sm"
                      className="text-xs h-auto py-2"
                      onClick={() => addMedication(med.drug, med.dose, med.route)}
                    >
                      {med.drug} {med.dose}
                    </Button>
                  ))}
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {medications.map((med) => (
                    <div key={med.id} className="flex items-center justify-between p-2 bg-muted rounded text-xs">
                      <span className="font-medium">{med.drug}</span>
                      <span>{med.dose}</span>
                      <Badge variant="outline" className="text-xs">{med.time}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Rhythm Checks */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Rhythm Check
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {RHYTHMS.map((rhythm) => (
                    <Badge 
                      key={rhythm} 
                      variant={currentRhythm === rhythm ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setCurrentRhythm(rhythm)}
                    >
                      {rhythm}
                    </Badge>
                  ))}
                </div>
                <div className="pt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox id="pulse" />
                    <Label htmlFor="pulse" className="text-sm">Pulse Check Performed</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 border-success text-success hover:bg-success/10"
                      onClick={() => setRosc(true)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      ROSC
                    </Button>
                    <Button variant="outline" className="flex-1">
                      No Pulse
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CPR Cycles Log */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">CPR Cycles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {cycles.map((cycle) => (
                  <Badge 
                    key={cycle.id} 
                    variant={cycle.endTime ? "secondary" : "default"}
                    className="py-1"
                  >
                    Cycle {cycle.cycleNumber}: {cycle.startTime} {cycle.endTime && `- ${cycle.endTime}`}
                  </Badge>
                ))}
                {cycles.length === 0 && (
                  <span className="text-muted-foreground text-sm">No CPR cycles recorded yet</span>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("activation")}>Back</Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="border-success text-success"
                onClick={() => { setRosc(true); setCurrentPhase("postresus"); }}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                ROSC Achieved
              </Button>
              <Button 
                variant="outline"
                className="border-destructive text-destructive"
                onClick={() => setCurrentPhase("postresus")}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Terminate Resuscitation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Post-ROSC / Termination Phase */}
      {currentPhase === "postresus" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className={`pb-3 ${rosc ? "bg-success/10" : "bg-destructive/10"}`}>
              <CardTitle className={`text-base flex items-center gap-2 ${rosc ? "text-success" : "text-destructive"}`}>
                {rosc ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                {rosc ? "ROSC Achieved" : "Resuscitation Terminated"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {rosc ? (
                <>
                  <div>
                    <Label className="text-sm font-medium">Time of ROSC</Label>
                    <Input type="time" className="mt-2" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total Down Time</Label>
                    <Input className="mt-2" placeholder="minutes" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Post-ROSC Rhythm</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {["Sinus Rhythm", "AF", "Bradycardia", "Tachycardia", "Other"].map((rhythm) => (
                        <Badge key={rhythm} variant="outline" className="cursor-pointer hover:bg-secondary">
                          {rhythm}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-sm font-medium">Time of Termination</Label>
                    <Input type="time" className="mt-2" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Decision Made By</Label>
                    <Input className="mt-2" placeholder="Team leader name" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Reason for Termination</Label>
                    <Textarea className="mt-2" placeholder="Clinical reasoning..." />
                  </div>
                </>
              )}

              <div>
                <Label className="text-sm font-medium">Probable Cause of Arrest</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Cardiac", "Respiratory", "Sepsis", "Hypovolemia", "Electrolyte", "Drug/Toxin", "Trauma", "Unknown"].map((cause) => (
                    <Badge key={cause} variant="outline" className="cursor-pointer hover:bg-secondary">
                      {cause}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{rosc ? "Post-ROSC Care Plan" : "Post-Mortem Actions"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rosc ? (
                <>
                  <div>
                    <Label className="text-sm font-medium">Destination</Label>
                    <div className="flex gap-2 mt-2">
                      {["ICU", "CCU", "HDU", "Cath Lab"].map((dest) => (
                        <Badge key={dest} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                          {dest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Immediate Actions</Label>
                    <div className="space-y-2 mt-2">
                      {["12-lead ECG", "Arterial line", "Central line", "Targeted temperature management", "Coronary angiography"].map((action) => (
                        <div key={action} className="flex items-center gap-2">
                          <Checkbox id={action} />
                          <Label htmlFor={action} className="text-sm cursor-pointer">{action}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    {["Family notified", "Consultant informed", "Death certificate initiated", "Body prepared", "Belongings secured"].map((action) => (
                      <div key={action} className="flex items-center gap-2">
                        <Checkbox id={action} />
                        <Label htmlFor={action} className="text-sm cursor-pointer">{action}</Label>
                      </div>
                    ))}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Post-mortem Required?</Label>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="cursor-pointer">Yes - Required</Badge>
                      <Badge variant="outline" className="cursor-pointer">No</Badge>
                      <Badge variant="outline" className="cursor-pointer">Pending Decision</Badge>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="col-span-2 flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("resus")}>Back</Button>
            <Button onClick={() => setCurrentPhase("summary")}>
              Generate Summary
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Summary Phase */}
      {currentPhase === "summary" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Resuscitation Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold">{cycles.length}</div>
                <div className="text-xs text-muted-foreground">CPR Cycles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{defibrillations.length}</div>
                <div className="text-xs text-muted-foreground">Defibrillations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{medications.length}</div>
                <div className="text-xs text-muted-foreground">Medications</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatTime(cprTimer)}</div>
                <div className="text-xs text-muted-foreground">Total CPR Time</div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Final Outcome</Label>
              <Badge variant={rosc ? "default" : "destructive"} className="mt-2 text-lg px-4 py-1">
                {rosc ? "ROSC Achieved - Survived to ICU" : "Resuscitation Unsuccessful"}
              </Badge>
            </div>

            <div>
              <Label className="text-sm font-medium">Summary Notes</Label>
              <Textarea className="mt-2 min-h-[100px]" placeholder="Additional notes about the resuscitation..." />
            </div>

            <Button className="w-full">
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Resuscitation Workspace
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
