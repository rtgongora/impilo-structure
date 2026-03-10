import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  Droplets, AlertTriangle, Clock, Activity, Plus, 
  ChevronRight, ThermometerIcon, CheckCircle, FileText, 
  Heart, Scale, Gauge, Timer, CircleAlert, TrendingDown, TrendingUp
} from "lucide-react";
import { useState, useEffect } from "react";

interface VitalReading {
  time: string;
  bp: string;
  hr: number;
  temp: number;
  ufRate: number;
  notes?: string;
}

interface ComplicationEntry {
  time: string;
  type: string;
  severity: "mild" | "moderate" | "severe";
  action: string;
}

const DIALYSIS_MODES = [
  { id: "hd", label: "Hemodialysis (HD)", description: "Standard intermittent HD" },
  { id: "hdf", label: "Hemodiafiltration (HDF)", description: "High-flux with convection" },
  { id: "crrt", label: "CRRT", description: "Continuous renal replacement" },
  { id: "pd", label: "Peritoneal Dialysis", description: "For PD training/review" },
];

const ACCESS_TYPES = [
  "AVF - Left Arm", "AVF - Right Arm", "AVG - Left Arm", "AVG - Right Arm",
  "Tunneled CVC - Right IJ", "Tunneled CVC - Left IJ", "Tunneled CVC - Femoral",
  "Temporary CVC"
];

const COMMON_COMPLICATIONS = [
  "Hypotension", "Cramps", "Nausea/Vomiting", "Headache", "Chest Pain",
  "Access Bleeding", "Access Clotting", "Arrhythmia", "Hemolysis", "Air Embolism"
];

const PRE_DIALYSIS_CHECKS = [
  { id: "identity", label: "Patient identity verified" },
  { id: "weight", label: "Pre-dialysis weight recorded" },
  { id: "bp", label: "Pre-dialysis vitals recorded" },
  { id: "access", label: "Access assessed (bruit/thrill)" },
  { id: "meds", label: "Medications reviewed" },
  { id: "labs", label: "Recent labs reviewed" },
  { id: "consent", label: "Treatment parameters confirmed" },
  { id: "machine", label: "Machine safety checks done" },
];

export function DialysisWorkspace() {
  const [currentPhase, setCurrentPhase] = useState<"precheck" | "dialysis" | "monitoring" | "postcheck">("precheck");
  const [selectedMode, setSelectedMode] = useState("hd");
  const [selectedAccess, setSelectedAccess] = useState("");
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [vitalsLog, setVitalsLog] = useState<VitalReading[]>([]);
  const [complications, setComplications] = useState<ComplicationEntry[]>([]);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Session Parameters
  const [sessionParams, setSessionParams] = useState({
    duration: 240, // minutes
    ufGoal: 2.5, // liters
    bloodFlow: 350, // mL/min
    dialysateFlow: 500, // mL/min
    dryWeight: 70, // kg
    preWeight: 72.5, // kg
  });

  const ufRemoved = (elapsedMinutes / sessionParams.duration) * sessionParams.ufGoal;
  const currentWeight = sessionParams.preWeight - ufRemoved;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning && elapsedMinutes < sessionParams.duration) {
      interval = setInterval(() => {
        setElapsedMinutes(prev => prev + 1);
      }, 60000); // Update every minute in real usage
    }
    return () => clearInterval(interval);
  }, [isRunning, elapsedMinutes, sessionParams.duration]);

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const addVitalReading = () => {
    const newReading: VitalReading = {
      time: new Date().toLocaleTimeString(),
      bp: "130/80",
      hr: 78,
      temp: 36.5,
      ufRate: (sessionParams.ufGoal / (sessionParams.duration / 60)) * 1000,
    };
    setVitalsLog(prev => [...prev, newReading]);
  };

  const addComplication = (type: string) => {
    setComplications(prev => [...prev, {
      time: new Date().toLocaleTimeString(),
      type,
      severity: "mild",
      action: ""
    }]);
  };

  const phases = [
    { id: "precheck", label: "Pre-Dialysis" },
    { id: "dialysis", label: "Dialysis Session" },
    { id: "monitoring", label: "Monitoring" },
    { id: "postcheck", label: "Post-Dialysis" },
  ];

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}:${mins.toString().padStart(2, '0')}`;
  };

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

      {/* Session Status Banner */}
      {isRunning && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="destructive" className="animate-pulse">
                  <Timer className="w-3 h-3 mr-1" />
                  ACTIVE SESSION
                </Badge>
                <Badge variant="outline">
                  {DIALYSIS_MODES.find(m => m.id === selectedMode)?.label}
                </Badge>
                <Badge variant="secondary">{selectedAccess}</Badge>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Elapsed</p>
                  <p className="font-mono font-bold">{formatTime(elapsedMinutes)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">UF Removed</p>
                  <p className="font-mono font-bold">{ufRemoved.toFixed(2)} L</p>
                </div>
                <Progress value={(elapsedMinutes / sessionParams.duration) * 100} className="w-32 h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pre-Check Phase */}
      {currentPhase === "precheck" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Droplets className="w-5 h-5 text-primary" />
                Dialysis Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {DIALYSIS_MODES.map((mode) => (
                <div
                  key={mode.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedMode === mode.id 
                      ? "border-primary bg-primary/5" 
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedMode(mode.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{mode.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{mode.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Vascular Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {ACCESS_TYPES.map((access) => (
                  <div
                    key={access}
                    className={`p-2 border rounded-lg cursor-pointer transition-colors text-sm ${
                      selectedAccess === access 
                        ? "border-primary bg-primary/5" 
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedAccess(access)}
                  >
                    {access}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                Session Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Pre-Dialysis Weight (kg)</Label>
                  <Input 
                    type="number" 
                    value={sessionParams.preWeight}
                    onChange={(e) => setSessionParams(p => ({...p, preWeight: parseFloat(e.target.value)}))}
                    className="mt-1" 
                  />
                </div>
                <div>
                  <Label className="text-sm">Dry Weight (kg)</Label>
                  <Input 
                    type="number" 
                    value={sessionParams.dryWeight}
                    onChange={(e) => setSessionParams(p => ({...p, dryWeight: parseFloat(e.target.value)}))}
                    className="mt-1" 
                  />
                </div>
                <div>
                  <Label className="text-sm">UF Goal (L)</Label>
                  <Input 
                    type="number" 
                    step="0.1"
                    value={sessionParams.ufGoal}
                    onChange={(e) => setSessionParams(p => ({...p, ufGoal: parseFloat(e.target.value)}))}
                    className="mt-1" 
                  />
                </div>
                <div>
                  <Label className="text-sm">Duration (min)</Label>
                  <Input 
                    type="number" 
                    value={sessionParams.duration}
                    onChange={(e) => setSessionParams(p => ({...p, duration: parseInt(e.target.value)}))}
                    className="mt-1" 
                  />
                </div>
                <div>
                  <Label className="text-sm">Blood Flow (mL/min)</Label>
                  <Input 
                    type="number" 
                    value={sessionParams.bloodFlow}
                    onChange={(e) => setSessionParams(p => ({...p, bloodFlow: parseInt(e.target.value)}))}
                    className="mt-1" 
                  />
                </div>
                <div>
                  <Label className="text-sm">Dialysate Flow (mL/min)</Label>
                  <Input 
                    type="number" 
                    value={sessionParams.dialysateFlow}
                    onChange={(e) => setSessionParams(p => ({...p, dialysateFlow: parseInt(e.target.value)}))}
                    className="mt-1" 
                  />
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Calculated UF Rate:</span>
                  <span className="font-medium">
                    {((sessionParams.ufGoal / (sessionParams.duration / 60)) * 1000).toFixed(0)} mL/hr
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Pre-Dialysis Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {PRE_DIALYSIS_CHECKS.map((item) => (
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
              <div className="pt-2">
                <Progress 
                  value={(checkedItems.length / PRE_DIALYSIS_CHECKS.length) * 100} 
                  className="h-2" 
                />
              </div>
            </CardContent>
          </Card>

          <div className="col-span-2 flex justify-end">
            <Button 
              onClick={() => {
                setCurrentPhase("dialysis");
                setIsRunning(true);
              }}
              disabled={checkedItems.length < PRE_DIALYSIS_CHECKS.length || !selectedAccess}
            >
              Start Dialysis Session
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialysis Session Phase */}
      {currentPhase === "dialysis" && (
        <div className="grid grid-cols-3 gap-6">
          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Gauge className="w-5 h-5 text-primary" />
                Machine Parameters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Blood Flow</p>
                  <p className="text-2xl font-bold">{sessionParams.bloodFlow}</p>
                  <p className="text-xs text-muted-foreground">mL/min</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Dialysate Flow</p>
                  <p className="text-2xl font-bold">{sessionParams.dialysateFlow}</p>
                  <p className="text-xs text-muted-foreground">mL/min</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">UF Rate</p>
                  <p className="text-2xl font-bold">
                    {((sessionParams.ufGoal / (sessionParams.duration / 60)) * 1000).toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground">mL/hr</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">UF Removed</p>
                  <p className="text-2xl font-bold text-primary">{ufRemoved.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">L of {sessionParams.ufGoal}L</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Arterial Pressure</p>
                  <p className="font-medium">-180 mmHg</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Venous Pressure</p>
                  <p className="font-medium">+120 mmHg</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">TMP</p>
                  <p className="font-medium">180 mmHg</p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={() => setIsRunning(!isRunning)}>
                  {isRunning ? "Pause Session" : "Resume Session"}
                </Button>
                <Button variant="outline">Adjust UF Rate</Button>
                <Button variant="outline">Adjust Blood Flow</Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Scale className="w-5 h-5 text-primary" />
                  Weight Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pre-Weight</span>
                    <span className="font-medium">{sessionParams.preWeight} kg</span>
                  </div>
                </div>
                <div className="p-3 border rounded-lg bg-primary/5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Current Est.</span>
                    <span className="font-medium text-primary">{currentWeight.toFixed(1)} kg</span>
                  </div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Target (Dry)</span>
                    <span className="font-medium">{sessionParams.dryWeight} kg</span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <TrendingDown className="w-4 h-4 text-green-500" />
                  <span>{(sessionParams.preWeight - currentWeight).toFixed(2)} kg removed</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Session Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl font-mono font-bold">{formatTime(elapsedMinutes)}</p>
                  <p className="text-sm text-muted-foreground">
                    of {formatTime(sessionParams.duration)}
                  </p>
                  <Progress 
                    value={(elapsedMinutes / sessionParams.duration) * 100} 
                    className="h-2 mt-2" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-3 flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("precheck")}>Back</Button>
            <Button onClick={() => setCurrentPhase("monitoring")}>
              View Monitoring
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
                <Heart className="w-5 h-5 text-primary" />
                Vitals Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {vitalsLog.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No vitals recorded yet
                  </p>
                ) : (
                  vitalsLog.map((reading, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                      <Badge variant="outline">{reading.time}</Badge>
                      <span>BP: {reading.bp}</span>
                      <span>HR: {reading.hr}</span>
                      <span>T: {reading.temp}°C</span>
                    </div>
                  ))
                )}
              </div>
              <Button size="sm" className="w-full mt-4" onClick={addVitalReading}>
                <Plus className="w-4 h-4 mr-1" />
                Record Vitals (Q30min)
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CircleAlert className="w-5 h-5 text-warning" />
                Complications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {COMMON_COMPLICATIONS.map((comp) => (
                  <Badge 
                    key={comp} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => addComplication(comp)}
                  >
                    {comp}
                  </Badge>
                ))}
              </div>

              {complications.length > 0 && (
                <div className="space-y-2 mt-4">
                  {complications.map((comp, idx) => (
                    <div key={idx} className="p-2 bg-destructive/10 border border-destructive/30 rounded">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">{comp.type}</span>
                        <Badge variant="outline">{comp.time}</Badge>
                      </div>
                      <Input 
                        placeholder="Action taken..." 
                        className="mt-2 h-8 text-sm"
                        value={comp.action}
                        onChange={(e) => {
                          const updated = [...complications];
                          updated[idx].action = e.target.value;
                          setComplications(updated);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Intradialytic Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="Document any events, interventions, patient complaints, nursing observations..."
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>

          <div className="col-span-2 flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("dialysis")}>Back</Button>
            <Button 
              onClick={() => {
                setIsRunning(false);
                setCurrentPhase("postcheck");
              }}
            >
              End Session
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Post-Check Phase */}
      {currentPhase === "postcheck" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                Post-Dialysis Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Post-Dialysis Weight (kg)</Label>
                  <Input type="number" placeholder={sessionParams.dryWeight.toString()} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Actual UF Removed (L)</Label>
                  <Input type="number" value={ufRemoved.toFixed(2)} className="mt-1 bg-muted" readOnly />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm">Post BP</Label>
                  <Input placeholder="120/80" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Post HR</Label>
                  <Input placeholder="76" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Post Temp</Label>
                  <Input placeholder="36.5" className="mt-1" />
                </div>
              </div>

              <div className="space-y-2">
                {[
                  "Access hemostasis achieved",
                  "Access site dressing applied",
                  "Patient stable for discharge",
                  "Post-dialysis instructions given",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <Checkbox />
                    <Label className="text-sm">{item}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Session Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xl font-bold">{formatTime(elapsedMinutes)}</p>
                  <p className="text-xs text-muted-foreground">Duration</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xl font-bold">{ufRemoved.toFixed(2)} L</p>
                  <p className="text-xs text-muted-foreground">UF Removed</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xl font-bold">{vitalsLog.length}</p>
                  <p className="text-xs text-muted-foreground">Vital Checks</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xl font-bold">{complications.length}</p>
                  <p className="text-xs text-muted-foreground">Complications</p>
                </div>
              </div>

              <div>
                <Label className="text-sm">Next Session</Label>
                <Input type="datetime-local" className="mt-1" />
              </div>

              <div>
                <Label className="text-sm">Nurse Notes</Label>
                <Textarea placeholder="Session summary, any concerns, plan for next session..." className="mt-1" />
              </div>
            </CardContent>
          </Card>

          <div className="col-span-2 flex justify-end gap-2">
            <Button variant="outline">Print Summary</Button>
            <Button>
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Session
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
