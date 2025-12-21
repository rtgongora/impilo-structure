import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertTriangle, Clock, User, Users, Activity, Wind, Heart, Brain,
  Thermometer, Plus, ChevronRight, Stethoscope, Syringe, FileText,
  Zap, Eye, Volume2
} from "lucide-react";
import { useState } from "react";

interface TraumaIntervention {
  id: string;
  time: string;
  type: string;
  description: string;
  performedBy: string;
}

const TEAM_ROLES = [
  { role: "Team Leader", icon: Users, required: true },
  { role: "Airway", icon: Wind, required: true },
  { role: "Circulation / IV", icon: Heart, required: true },
  { role: "Procedures", icon: Syringe, required: false },
  { role: "Documentation", icon: FileText, required: true },
  { role: "Radiology Liaison", icon: Eye, required: false },
];

const PRIMARY_SURVEY_ITEMS = {
  airway: [
    { id: "patent", label: "Airway patent" },
    { id: "compromised", label: "Airway compromised - intervention needed" },
    { id: "cspine", label: "C-spine immobilisation maintained" },
  ],
  breathing: [
    { id: "adequate", label: "Breathing adequate" },
    { id: "equal_expansion", label: "Equal chest expansion" },
    { id: "breath_sounds", label: "Breath sounds equal bilaterally" },
    { id: "oxygen", label: "High-flow oxygen applied" },
  ],
  circulation: [
    { id: "pulse_present", label: "Pulse present" },
    { id: "iv_access", label: "IV access established" },
    { id: "bleeding_controlled", label: "Visible bleeding controlled" },
    { id: "fluids", label: "Fluid resuscitation initiated" },
  ],
  disability: [
    { id: "gcs_done", label: "GCS assessed" },
    { id: "pupils_checked", label: "Pupils checked" },
    { id: "limb_movement", label: "Limb movement assessed" },
    { id: "glucose", label: "Blood glucose checked" },
  ],
  exposure: [
    { id: "fully_exposed", label: "Patient fully exposed" },
    { id: "log_roll", label: "Log roll performed" },
    { id: "hypothermia", label: "Hypothermia prevention measures" },
    { id: "temperature", label: "Temperature measured" },
  ],
};

const SECONDARY_SURVEY_REGIONS = [
  { id: "head", label: "Head", icon: Brain },
  { id: "face", label: "Face", icon: Eye },
  { id: "neck", label: "Neck", icon: Volume2 },
  { id: "chest", label: "Chest", icon: Heart },
  { id: "abdomen", label: "Abdomen", icon: Activity },
  { id: "pelvis", label: "Pelvis", icon: Activity },
  { id: "spine", label: "Spine", icon: Activity },
  { id: "extremities", label: "Extremities", icon: Activity },
];

export function TraumaWorkspace() {
  const [currentPhase, setCurrentPhase] = useState<"activation" | "primary" | "interventions" | "secondary" | "summary">("activation");
  const [surveyChecks, setSurveyChecks] = useState<Record<string, boolean>>({});
  const [interventions, setInterventions] = useState<TraumaIntervention[]>([]);
  const [vitals, setVitals] = useState({ hr: "", bp: "", rr: "", spo2: "", gcs: "" });

  const toggleSurveyItem = (id: string) => {
    setSurveyChecks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const addIntervention = () => {
    const newIntervention: TraumaIntervention = {
      id: `INT-${Date.now()}`,
      time: new Date().toLocaleTimeString(),
      type: "",
      description: "",
      performedBy: "",
    };
    setInterventions(prev => [...prev, newIntervention]);
  };

  const phases = [
    { id: "activation", label: "Activation" },
    { id: "primary", label: "Primary Survey (ABCDE)" },
    { id: "interventions", label: "Interventions" },
    { id: "secondary", label: "Secondary Survey" },
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
              className={`whitespace-nowrap ${currentPhase === phase.id && phase.id === "primary" ? "bg-destructive" : ""}`}
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
                Trauma Activation
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <Label className="text-sm font-medium">Mechanism of Injury</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["RTA - Driver", "RTA - Passenger", "RTA - Pedestrian", "Fall", "Assault", "Stabbing", "Gunshot", "Burns", "Other"].map((mech) => (
                    <Badge key={mech} variant="outline" className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground">
                      {mech}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Pre-Hospital Information</Label>
                <Textarea className="mt-2" placeholder="EMS handover, mechanism details, treatment given en route..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Arrival Mode</Label>
                  <div className="flex gap-2 mt-2">
                    {["Ambulance", "Private", "Walk-in", "Transfer"].map((mode) => (
                      <Badge key={mode} variant="outline" className="cursor-pointer hover:bg-secondary text-xs">
                        {mode}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Trauma Level</Label>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="destructive" className="cursor-pointer">Level 1</Badge>
                    <Badge variant="default" className="cursor-pointer">Level 2</Badge>
                    <Badge variant="secondary" className="cursor-pointer">Level 3</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Trauma Team
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {TEAM_ROLES.map((member) => {
                const Icon = member.icon;
                return (
                  <div key={member.role} className="flex items-center gap-3 p-2 border rounded-lg">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">{member.role}</Label>
                      <Input placeholder="Team member name" className="h-8 text-sm mt-1" />
                    </div>
                    {member.required && <Badge variant="outline" className="text-xs">Required</Badge>}
                  </div>
                );
              })}
              <Button className="w-full mt-4" onClick={() => setCurrentPhase("primary")}>
                Begin Primary Survey
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Primary Survey (ABCDE) */}
      {currentPhase === "primary" && (
        <div className="space-y-4">
          {/* Vital Signs Bar */}
          <Card className="bg-muted/50">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-destructive" />
                    <Input 
                      placeholder="HR" 
                      className="w-16 h-8 text-center" 
                      value={vitals.hr}
                      onChange={(e) => setVitals(prev => ({ ...prev, hr: e.target.value }))}
                    />
                    <span className="text-xs text-muted-foreground">bpm</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <Input 
                      placeholder="BP" 
                      className="w-20 h-8 text-center" 
                      value={vitals.bp}
                      onChange={(e) => setVitals(prev => ({ ...prev, bp: e.target.value }))}
                    />
                    <span className="text-xs text-muted-foreground">mmHg</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wind className="w-4 h-4 text-blue-500" />
                    <Input 
                      placeholder="RR" 
                      className="w-16 h-8 text-center" 
                      value={vitals.rr}
                      onChange={(e) => setVitals(prev => ({ ...prev, rr: e.target.value }))}
                    />
                    <span className="text-xs text-muted-foreground">/min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-green-500" />
                    <Input 
                      placeholder="SpO2" 
                      className="w-16 h-8 text-center" 
                      value={vitals.spo2}
                      onChange={(e) => setVitals(prev => ({ ...prev, spo2: e.target.value }))}
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-500" />
                    <Input 
                      placeholder="GCS" 
                      className="w-16 h-8 text-center" 
                      value={vitals.gcs}
                      onChange={(e) => setVitals(prev => ({ ...prev, gcs: e.target.value }))}
                    />
                    <span className="text-xs text-muted-foreground">/15</span>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Clock className="w-4 h-4 mr-1" />
                  Record Vitals
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ABCDE Survey Cards */}
          <div className="grid grid-cols-5 gap-4">
            {Object.entries(PRIMARY_SURVEY_ITEMS).map(([key, items]) => {
              const labels: Record<string, { label: string; color: string; icon: any }> = {
                airway: { label: "A - Airway", color: "bg-red-500", icon: Wind },
                breathing: { label: "B - Breathing", color: "bg-orange-500", icon: Wind },
                circulation: { label: "C - Circulation", color: "bg-yellow-500", icon: Heart },
                disability: { label: "D - Disability", color: "bg-green-500", icon: Brain },
                exposure: { label: "E - Exposure", color: "bg-blue-500", icon: Thermometer },
              };
              const config = labels[key];
              const Icon = config.icon;

              return (
                <Card key={key}>
                  <CardHeader className={`pb-2 ${config.color} text-white`}>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {config.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3 space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => toggleSurveyItem(item.id)}
                        className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-colors text-xs ${
                          surveyChecks[item.id] ? "bg-success/10 border-success/30" : "hover:bg-muted/50"
                        }`}
                      >
                        <Checkbox checked={surveyChecks[item.id] || false} className="h-3 w-3" />
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("activation")}>Back</Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCurrentPhase("interventions")}>
                Log Intervention
              </Button>
              <Button onClick={() => setCurrentPhase("secondary")}>
                Secondary Survey
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Interventions */}
      {currentPhase === "interventions" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Syringe className="w-5 h-5 text-primary" />
              Trauma Interventions
            </CardTitle>
            <Button size="sm" onClick={addIntervention}>
              <Plus className="w-4 h-4 mr-1" />
              Add Intervention
            </Button>
          </CardHeader>
          <CardContent>
            {interventions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Syringe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No interventions recorded yet</p>
                <Button variant="outline" className="mt-2" onClick={addIntervention}>
                  Add First Intervention
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {interventions.map((int, idx) => (
                  <div key={int.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-4 mb-3">
                      <Badge variant="secondary">#{idx + 1}</Badge>
                      <Badge variant="outline">{int.time}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs">Type</Label>
                        <select className="w-full p-2 border rounded mt-1 text-sm">
                          <option value="">Select type...</option>
                          <option value="airway">Airway management</option>
                          <option value="breathing">Chest intervention</option>
                          <option value="circulation">IV/IO access</option>
                          <option value="fluids">Fluid/Blood</option>
                          <option value="medication">Medication</option>
                          <option value="procedure">Procedure</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs">Description</Label>
                        <Input placeholder="Describe intervention" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Performed By</Label>
                        <Input placeholder="Team member" className="mt-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={() => setCurrentPhase("primary")}>Back to Primary Survey</Button>
              <Button onClick={() => setCurrentPhase("secondary")}>Continue to Secondary Survey</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Secondary Survey */}
      {currentPhase === "secondary" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Secondary Survey - Head to Toe Examination</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {SECONDARY_SURVEY_REGIONS.map((region) => {
                  const Icon = region.icon;
                  return (
                    <div key={region.id} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4 text-primary" />
                        <Label className="font-medium">{region.label}</Label>
                      </div>
                      <Textarea placeholder={`${region.label} examination findings...`} className="min-h-[60px]" />
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="cursor-pointer hover:bg-success/10 text-xs">NAD</Badge>
                        <Badge variant="outline" className="cursor-pointer hover:bg-destructive/10 text-xs">Injury Found</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Trauma Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">GCS</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input placeholder="E" className="w-12 text-center" />
                    <span>+</span>
                    <Input placeholder="V" className="w-12 text-center" />
                    <span>+</span>
                    <Input placeholder="M" className="w-12 text-center" />
                    <span>=</span>
                    <Badge variant="secondary" className="text-lg px-3">15</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">RTS (Revised Trauma Score)</Label>
                  <Input className="mt-2" placeholder="Calculate RTS" />
                </div>
                <div>
                  <Label className="text-sm font-medium">ISS (Injury Severity Score)</Label>
                  <Input className="mt-2" placeholder="Calculate ISS" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("interventions")}>Back</Button>
            <Button onClick={() => setCurrentPhase("summary")}>
              Generate Summary
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Summary */}
      {currentPhase === "summary" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Trauma Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Diagnosis Summary</Label>
                <Textarea className="mt-2 min-h-[100px]" placeholder="List all injuries identified..." />
              </div>
              <div>
                <Label className="text-sm font-medium">Management Plan</Label>
                <Textarea className="mt-2 min-h-[100px]" placeholder="Immediate management and disposition plan..." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Disposition</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Disposition Decision</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Theatre", "ICU", "HDU", "Ward Admission", "Observation", "Transfer", "Discharge"].map((disp) => (
                    <Badge key={disp} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                      {disp}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Priority</Label>
                <div className="flex gap-2 mt-2">
                  <Badge variant="destructive" className="cursor-pointer">Immediate</Badge>
                  <Badge className="bg-warning text-warning-foreground cursor-pointer">Urgent</Badge>
                  <Badge variant="secondary" className="cursor-pointer">Delayed</Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Consults Needed</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Orthopaedics", "Neurosurgery", "General Surgery", "Cardiothoracic", "Vascular", "Plastics"].map((spec) => (
                    <Badge key={spec} variant="outline" className="cursor-pointer hover:bg-secondary text-xs">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button className="w-full mt-4">
                Complete Trauma Workspace
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
