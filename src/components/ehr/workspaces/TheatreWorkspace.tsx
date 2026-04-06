import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DictatableTextarea } from "@/components/ui/dictatable-textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, Clock, User, Users, Stethoscope, Syringe, 
  Package, FileText, AlertTriangle, Play, Square, Heart,
  Thermometer, Droplets, Scissors, Plus, ChevronRight
} from "lucide-react";
import { useState } from "react";

interface TheatreStep {
  id: string;
  label: string;
  completed: boolean;
  time?: string;
  critical?: boolean;
}

const PREOP_CHECKLIST: TheatreStep[] = [
  { id: "consent", label: "Consent forms signed", completed: false, critical: true },
  { id: "identity", label: "Patient identity verified", completed: false, critical: true },
  { id: "site", label: "Surgical site marked", completed: false, critical: true },
  { id: "allergies", label: "Allergies confirmed", completed: false, critical: true },
  { id: "fasting", label: "Fasting status verified", completed: false },
  { id: "bloods", label: "Blood available if needed", completed: false },
  { id: "imaging", label: "Relevant imaging available", completed: false },
  { id: "equipment", label: "Equipment & implants ready", completed: false },
];

const SURGICAL_SAFETY_CHECKLIST = {
  signIn: [
    { id: "patient_confirm", label: "Patient confirmed identity, site, procedure, consent" },
    { id: "site_marked", label: "Site marked / not applicable" },
    { id: "anaesthesia_check", label: "Anaesthesia safety check complete" },
    { id: "pulse_ox", label: "Pulse oximeter on patient and functioning" },
    { id: "allergies_known", label: "Known allergies?" },
    { id: "difficult_airway", label: "Difficult airway / aspiration risk?" },
    { id: "blood_loss", label: "Risk of >500ml blood loss?" },
  ],
  timeOut: [
    { id: "team_intro", label: "Team members introduced by name and role" },
    { id: "confirm_patient", label: "Confirm patient, site, procedure" },
    { id: "antibiotic_given", label: "Has antibiotic prophylaxis been given?" },
    { id: "critical_events", label: "Anticipated critical events reviewed" },
    { id: "imaging_displayed", label: "Essential imaging displayed" },
  ],
  signOut: [
    { id: "procedure_recorded", label: "Procedure recorded correctly" },
    { id: "counts_correct", label: "Instrument, sponge and needle counts correct" },
    { id: "specimen_labelled", label: "Specimen labelled correctly" },
    { id: "equipment_problems", label: "Any equipment problems addressed" },
    { id: "recovery_concerns", label: "Key concerns for recovery" },
  ],
};

const TEAM_ROLES = [
  { role: "Primary Surgeon", name: "", required: true },
  { role: "Assistant Surgeon", name: "", required: false },
  { role: "Anaesthetist", name: "", required: true },
  { role: "Scrub Nurse", name: "", required: true },
  { role: "Circulating Nurse", name: "", required: true },
  { role: "Anaesthetic Nurse", name: "", required: false },
];

export function TheatreWorkspace() {
  const [currentPhase, setCurrentPhase] = useState<"preop" | "signin" | "timeout" | "intraop" | "signout" | "postop">("preop");
  const [preopChecklist, setPreopChecklist] = useState(PREOP_CHECKLIST);
  const [theatreLog, setTheatreLog] = useState({
    patientInRoom: "",
    anaesthesiaStart: "",
    incisionStart: "",
    incisionClosure: "",
    outOfTheatre: "",
  });
  const [safetyChecklist, setSafetyChecklist] = useState<Record<string, boolean>>({});

  const togglePreopItem = (id: string) => {
    setPreopChecklist(prev => 
      prev.map(item => 
        item.id === id ? { ...item, completed: !item.completed, time: !item.completed ? new Date().toLocaleTimeString() : undefined } : item
      )
    );
  };

  const toggleSafetyItem = (id: string) => {
    setSafetyChecklist(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const recordTime = (field: keyof typeof theatreLog) => {
    setTheatreLog(prev => ({ ...prev, [field]: new Date().toLocaleTimeString() }));
  };

  const phases = [
    { id: "preop", label: "Pre-Op" },
    { id: "signin", label: "Sign In" },
    { id: "timeout", label: "Time Out" },
    { id: "intraop", label: "Intra-Op" },
    { id: "signout", label: "Sign Out" },
    { id: "postop", label: "Post-Op" },
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

      {/* Pre-Op Assessment & Checklist */}
      {currentPhase === "preop" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-primary" />
                Pre-Operative Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Procedure</Label>
                  <Input className="mt-1" placeholder="Procedure name" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <div className="flex gap-2 mt-1">
                    {["Elective", "Urgent", "Emergency"].map((p) => (
                      <Badge key={p} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Indication</Label>
                <Textarea className="mt-1" placeholder="Clinical indication for surgery..." />
              </div>

              <div>
                <Label className="text-sm font-medium">ASA Classification</Label>
                <div className="flex gap-2 mt-1">
                  {[1, 2, 3, 4, 5].map((asa) => (
                    <Badge key={asa} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                      ASA {asa}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Airway Assessment</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Mallampati:</span>
                    {[1, 2, 3, 4].map((m) => (
                      <Badge key={m} variant="outline" className="cursor-pointer text-xs">{m}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Difficulty:</span>
                    <Badge variant="outline" className="cursor-pointer text-xs">Easy</Badge>
                    <Badge variant="outline" className="cursor-pointer text-xs">Moderate</Badge>
                    <Badge variant="outline" className="cursor-pointer text-xs">Difficult</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Pre-Op Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {preopChecklist.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => togglePreopItem(item.id)}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      item.completed ? "bg-success/5 border-success/30" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox checked={item.completed} />
                      <span className={`text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                        {item.label}
                      </span>
                      {item.critical && !item.completed && (
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      )}
                    </div>
                    {item.time && (
                      <span className="text-xs text-muted-foreground">{item.time}</span>
                    )}
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4" onClick={() => setCurrentPhase("signin")}>
                Proceed to Sign In
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* WHO Sign In */}
      {currentPhase === "signin" && (
        <Card>
          <CardHeader className="pb-3 bg-warning/10 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              WHO Surgical Safety Checklist - SIGN IN (Before Induction)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {SURGICAL_SAFETY_CHECKLIST.signIn.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleSafetyItem(item.id)}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  safetyChecklist[item.id] ? "bg-success/5 border-success/30" : "hover:bg-muted/50"
                }`}
              >
                <Checkbox checked={safetyChecklist[item.id] || false} />
                <span className="text-sm">{item.label}</span>
              </div>
            ))}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentPhase("preop")}>Back</Button>
              <Button onClick={() => setCurrentPhase("timeout")}>
                Proceed to Time Out
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* WHO Time Out */}
      {currentPhase === "timeout" && (
        <Card>
          <CardHeader className="pb-3 bg-destructive/10 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <Square className="w-5 h-5 text-destructive" />
              WHO Surgical Safety Checklist - TIME OUT (Before Incision)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {SURGICAL_SAFETY_CHECKLIST.timeOut.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleSafetyItem(item.id)}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  safetyChecklist[item.id] ? "bg-success/5 border-success/30" : "hover:bg-muted/50"
                }`}
              >
                <Checkbox checked={safetyChecklist[item.id] || false} />
                <span className="text-sm">{item.label}</span>
              </div>
            ))}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentPhase("signin")}>Back</Button>
              <Button onClick={() => setCurrentPhase("intraop")}>
                Begin Surgery
                <Play className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Intra-Op */}
      {currentPhase === "intraop" && (
        <div className="grid grid-cols-3 gap-6">
          {/* Theatre Log */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Theatre Log
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: "patientInRoom", label: "Patient in Room" },
                { key: "anaesthesiaStart", label: "Anaesthesia Start" },
                { key: "incisionStart", label: "Incision Start" },
                { key: "incisionClosure", label: "Incision Closure" },
                { key: "outOfTheatre", label: "Out of Theatre" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">{item.label}</span>
                  {theatreLog[item.key as keyof typeof theatreLog] ? (
                    <Badge variant="secondary">{theatreLog[item.key as keyof typeof theatreLog]}</Badge>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => recordTime(item.key as keyof typeof theatreLog)}>
                      Record Time
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Surgical Team */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Surgical Team
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {TEAM_ROLES.map((member) => (
                <div key={member.role} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">{member.role}</Label>
                    <Input placeholder="Select team member" className="h-8 text-sm" />
                  </div>
                  {member.required && <Badge variant="outline" className="text-xs">Required</Badge>}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Anaesthesia Record */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Syringe className="w-5 h-5 text-primary" />
                Anaesthesia Record
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Anaesthesia Type</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {["General", "Spinal", "Epidural", "Regional", "Local", "Sedation"].map((type) => (
                    <Badge key={type} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Airway Device</Label>
                <Input placeholder="e.g., ETT 7.5, LMA" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm font-medium">Drugs Administered</Label>
                <Button variant="outline" size="sm" className="w-full mt-1">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Drug
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Intra-Op Steps & Notes */}
          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Scissors className="w-5 h-5 text-primary" />
                Intra-Operative Steps & Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea placeholder="Document surgical steps, findings, and events..." className="min-h-[150px]" />
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <Label className="text-sm font-medium">Est. Blood Loss (ml)</Label>
                  <Input type="number" placeholder="0" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Fluids Given (ml)</Label>
                  <Input type="number" placeholder="0" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Urine Output (ml)</Label>
                  <Input type="number" placeholder="0" className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Specimens & Implants */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Specimens & Implants
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Specimens</Label>
                <Button variant="outline" size="sm" className="w-full mt-1">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Specimen
                </Button>
              </div>
              <div>
                <Label className="text-sm font-medium">Implants/Devices</Label>
                <Button variant="outline" size="sm" className="w-full mt-1">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Implant
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="col-span-3 flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("timeout")}>Back</Button>
            <Button onClick={() => setCurrentPhase("signout")}>
              Proceed to Sign Out
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* WHO Sign Out */}
      {currentPhase === "signout" && (
        <Card>
          <CardHeader className="pb-3 bg-success/10 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              WHO Surgical Safety Checklist - SIGN OUT (Before Patient Leaves OR)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {SURGICAL_SAFETY_CHECKLIST.signOut.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleSafetyItem(item.id)}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  safetyChecklist[item.id] ? "bg-success/5 border-success/30" : "hover:bg-muted/50"
                }`}
              >
                <Checkbox checked={safetyChecklist[item.id] || false} />
                <span className="text-sm">{item.label}</span>
              </div>
            ))}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentPhase("intraop")}>Back</Button>
              <Button onClick={() => setCurrentPhase("postop")}>
                Proceed to Post-Op
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Post-Op Plan & Operative Note */}
      {currentPhase === "postop" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Post-Operative Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Destination</Label>
                <div className="flex gap-2 mt-1">
                  {["PACU", "ICU", "HDU", "Ward"].map((dest) => (
                    <Badge key={dest} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                      {dest}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Analgesia Plan</Label>
                <Textarea placeholder="Pain management plan..." className="mt-1" />
              </div>
              <div>
                <Label className="text-sm font-medium">Antibiotics</Label>
                <Input placeholder="Antibiotic regimen" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm font-medium">VTE Prophylaxis</Label>
                <Input placeholder="DVT prevention plan" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm font-medium">Monitoring Frequency</Label>
                <div className="flex gap-2 mt-1">
                  {["15 min", "30 min", "1 hour", "2 hours", "4 hours"].map((freq) => (
                    <Badge key={freq} variant="outline" className="cursor-pointer hover:bg-secondary text-xs">
                      {freq}
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
                Operative Note
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Pre-Op Diagnosis</Label>
                  <Input className="mt-1" placeholder="Pre-operative diagnosis" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Post-Op Diagnosis</Label>
                  <Input className="mt-1" placeholder="Post-operative diagnosis" />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Procedure Performed</Label>
                <Input className="mt-1" placeholder="Name of procedure" />
              </div>
              <div>
                <Label className="text-sm font-medium">Findings</Label>
                <Textarea className="mt-1" placeholder="Intra-operative findings..." />
              </div>
              <div>
                <Label className="text-sm font-medium">Complications</Label>
                <Input className="mt-1" placeholder="None / describe if any" />
              </div>
              <Button className="w-full">
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete & Sign Operative Note
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
