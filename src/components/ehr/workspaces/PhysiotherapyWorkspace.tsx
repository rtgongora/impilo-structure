import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { 
  Activity, Target, Clock, User, Plus, 
  ChevronRight, CheckCircle, FileText, Calendar,
  TrendingUp, Dumbbell, Move, Bone, Brain, Heart
} from "lucide-react";
import { useState } from "react";

interface Goal {
  id: string;
  description: string;
  targetDate: string;
  progress: number;
  status: "in_progress" | "achieved" | "not_achieved" | "modified";
}

interface SessionNote {
  date: string;
  duration: number;
  interventions: string[];
  patientResponse: string;
  homeExerciseCompliance: number;
  nextPlan: string;
}

const REFERRAL_REASONS = [
  "Post-operative Rehabilitation", "Musculoskeletal Pain", "Neurological Rehabilitation",
  "Cardiopulmonary Rehabilitation", "Sports Injury", "Falls Prevention",
  "Mobility Assessment", "Post-Fracture Rehab", "Stroke Rehabilitation"
];

const BODY_REGIONS = [
  "Cervical Spine", "Thoracic Spine", "Lumbar Spine", "Shoulder", 
  "Elbow", "Wrist/Hand", "Hip", "Knee", "Ankle/Foot", "Pelvis"
];

const ASSESSMENT_DOMAINS = [
  { id: "pain", label: "Pain", icon: Activity },
  { id: "rom", label: "Range of Motion", icon: Move },
  { id: "strength", label: "Strength", icon: Dumbbell },
  { id: "balance", label: "Balance", icon: Target },
  { id: "mobility", label: "Functional Mobility", icon: Bone },
  { id: "neuro", label: "Neurological", icon: Brain },
  { id: "cardio", label: "Cardiopulmonary", icon: Heart },
];

const INTERVENTIONS = [
  "Manual Therapy", "Therapeutic Exercise", "Stretching", "Strengthening",
  "Balance Training", "Gait Training", "Modalities (Heat/Cold)", "Electrotherapy",
  "Ultrasound", "Taping", "Dry Needling", "Patient Education",
  "Home Exercise Program", "Hydrotherapy", "Functional Training"
];

const OUTCOME_MEASURES = [
  { id: "vas", label: "VAS Pain Scale", range: "0-10" },
  { id: "tug", label: "Timed Up & Go", range: "seconds" },
  { id: "berg", label: "Berg Balance Scale", range: "0-56" },
  { id: "6mwt", label: "6-Minute Walk Test", range: "meters" },
  { id: "nprs", label: "NPRS", range: "0-10" },
  { id: "oswestry", label: "Oswestry Disability Index", range: "0-100%" },
];

export function PhysiotherapyWorkspace() {
  const [currentPhase, setCurrentPhase] = useState<"assessment" | "goals" | "session" | "progress">("assessment");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [painLevel, setPainLevel] = useState([5]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedInterventions, setSelectedInterventions] = useState<string[]>([]);
  const [sessions, setSessions] = useState<SessionNote[]>([]);
  const [newGoal, setNewGoal] = useState("");

  const toggleRegion = (region: string) => {
    setSelectedRegions(prev => 
      prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]
    );
  };

  const toggleIntervention = (intervention: string) => {
    setSelectedInterventions(prev => 
      prev.includes(intervention) ? prev.filter(i => i !== intervention) : [...prev, intervention]
    );
  };

  const addGoal = () => {
    if (newGoal) {
      setGoals(prev => [...prev, {
        id: Date.now().toString(),
        description: newGoal,
        targetDate: "",
        progress: 0,
        status: "in_progress"
      }]);
      setNewGoal("");
    }
  };

  const addSession = () => {
    setSessions(prev => [...prev, {
      date: new Date().toISOString().split('T')[0],
      duration: 45,
      interventions: selectedInterventions,
      patientResponse: "",
      homeExerciseCompliance: 80,
      nextPlan: ""
    }]);
  };

  const phases = [
    { id: "assessment", label: "Initial Assessment" },
    { id: "goals", label: "Goals & Plan" },
    { id: "session", label: "Session Notes" },
    { id: "progress", label: "Progress Review" },
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

      {/* Assessment Phase */}
      {currentPhase === "assessment" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Referral Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">Referral Reason</Label>
                <select className="w-full mt-1 border rounded-lg p-2">
                  <option value="">Select reason...</option>
                  {REFERRAL_REASONS.map(reason => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-sm">Referring Physician</Label>
                <Input placeholder="Dr. Smith" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">Relevant History</Label>
                <Textarea placeholder="Medical history, previous treatments, surgery details..." className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">Precautions/Contraindications</Label>
                <Textarea placeholder="Any restrictions, weight-bearing status, cardiac precautions..." className="mt-1" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bone className="w-5 h-5 text-primary" />
                Affected Regions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {BODY_REGIONS.map(region => (
                  <Badge
                    key={region}
                    variant={selectedRegions.includes(region) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleRegion(region)}
                  >
                    {region}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Subjective Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">Chief Complaint</Label>
                <Textarea placeholder="Patient's main concern in their own words..." className="mt-1" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Pain Location</Label>
                  <Input placeholder="Describe location" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Duration</Label>
                  <Input placeholder="e.g., 3 weeks" className="mt-1" />
                </div>
              </div>

              <div>
                <Label className="text-sm">Pain Level (VAS 0-10): {painLevel[0]}</Label>
                <Slider
                  value={painLevel}
                  onValueChange={setPainLevel}
                  max={10}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>No Pain</span>
                  <span>Worst Pain</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm">Aggravating Factors</Label>
                  <Textarea placeholder="Activities that worsen..." className="mt-1 h-20" />
                </div>
                <div>
                  <Label className="text-sm">Easing Factors</Label>
                  <Textarea placeholder="What helps..." className="mt-1 h-20" />
                </div>
                <div>
                  <Label className="text-sm">24-Hour Pattern</Label>
                  <Textarea placeholder="Morning stiffness, night pain..." className="mt-1 h-20" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Objective Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {ASSESSMENT_DOMAINS.map(domain => (
                  <div key={domain.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <domain.icon className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">{domain.label}</span>
                    </div>
                    <Textarea placeholder={`${domain.label} findings...`} className="h-20" />
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <Label className="text-sm">Outcome Measures (Baseline)</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  {OUTCOME_MEASURES.map(measure => (
                    <div key={measure.id} className="flex items-center gap-2">
                      <Label className="text-xs w-24">{measure.label}</Label>
                      <Input placeholder={measure.range} className="h-8" />
                    </div>
                  ))}
                </div>
              </div>

              <Button className="mt-4" onClick={() => setCurrentPhase("goals")}>
                Proceed to Goal Setting
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Goals Phase */}
      {currentPhase === "goals" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Treatment Goals (SMART)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="Enter a SMART goal..."
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                />
                <Button onClick={addGoal}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                {goals.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No goals set yet. Add SMART goals above.
                  </p>
                ) : (
                  goals.map((goal) => (
                    <div key={goal.id} className="p-3 border rounded-lg">
                      <p className="text-sm font-medium">{goal.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Input type="date" className="h-8 w-32" placeholder="Target Date" />
                        <Badge variant={goal.status === "achieved" ? "default" : "outline"}>
                          {goal.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Progress value={goal.progress} className="flex-1 h-2" />
                        <span className="text-xs text-muted-foreground">{goal.progress}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-primary" />
                Treatment Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Frequency</Label>
                  <select className="w-full mt-1 border rounded-lg p-2">
                    <option>1x weekly</option>
                    <option>2x weekly</option>
                    <option>3x weekly</option>
                    <option>Daily</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm">Duration</Label>
                  <select className="w-full mt-1 border rounded-lg p-2">
                    <option>4 weeks</option>
                    <option>6 weeks</option>
                    <option>8 weeks</option>
                    <option>12 weeks</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-sm">Planned Interventions</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {INTERVENTIONS.map(intervention => (
                    <Badge
                      key={intervention}
                      variant={selectedInterventions.includes(intervention) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleIntervention(intervention)}
                    >
                      {intervention}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm">Home Exercise Program</Label>
                <Textarea placeholder="Describe HEP exercises, frequency, duration..." className="mt-1" />
              </div>
            </CardContent>
          </Card>

          <div className="col-span-2 flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("assessment")}>Back</Button>
            <Button onClick={() => setCurrentPhase("session")}>
              Record Session
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Session Phase */}
      {currentPhase === "session" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Session Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Session Date</Label>
                  <Input type="date" className="mt-1" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <Label className="text-sm">Duration (min)</Label>
                  <Input type="number" placeholder="45" className="mt-1" />
                </div>
              </div>

              <div>
                <Label className="text-sm">Session Number</Label>
                <Badge variant="outline" className="ml-2">{sessions.length + 1}</Badge>
              </div>

              <div>
                <Label className="text-sm">Current Pain Level (VAS)</Label>
                <Slider
                  value={painLevel}
                  onValueChange={setPainLevel}
                  max={10}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0</span>
                  <span className="font-medium">{painLevel[0]}/10</span>
                  <span>10</span>
                </div>
              </div>

              <div>
                <Label className="text-sm">Interventions Performed</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {INTERVENTIONS.map(intervention => (
                    <Badge
                      key={intervention}
                      variant={selectedInterventions.includes(intervention) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleIntervention(intervention)}
                    >
                      {intervention}
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
                Session Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">Subjective (Patient Report)</Label>
                <Textarea placeholder="How is the patient feeling? Changes since last session?" className="mt-1" />
              </div>

              <div>
                <Label className="text-sm">Objective Findings</Label>
                <Textarea placeholder="ROM measurements, strength testing, observations..." className="mt-1" />
              </div>

              <div>
                <Label className="text-sm">Response to Treatment</Label>
                <Textarea placeholder="Patient's response to interventions..." className="mt-1" />
              </div>

              <div>
                <Label className="text-sm">HEP Compliance</Label>
                <div className="flex items-center gap-4 mt-1">
                  <Slider defaultValue={[80]} max={100} className="flex-1" />
                  <span className="text-sm font-medium">80%</span>
                </div>
              </div>

              <div>
                <Label className="text-sm">Plan for Next Session</Label>
                <Textarea placeholder="Focus areas, progression, modifications..." className="mt-1" />
              </div>
            </CardContent>
          </Card>

          <div className="col-span-2 flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("goals")}>Back</Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={addSession}>Save Session</Button>
              <Button onClick={() => setCurrentPhase("progress")}>
                View Progress
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Phase */}
      {currentPhase === "progress" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Goal Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {goals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No goals to track yet.
                </p>
              ) : (
                goals.map((goal) => (
                  <div key={goal.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{goal.description}</p>
                      <select 
                        className="text-xs border rounded p-1"
                        value={goal.status}
                        onChange={(e) => {
                          setGoals(prev => prev.map(g => 
                            g.id === goal.id ? {...g, status: e.target.value as Goal["status"]} : g
                          ));
                        }}
                      >
                        <option value="in_progress">In Progress</option>
                        <option value="achieved">Achieved</option>
                        <option value="modified">Modified</option>
                        <option value="not_achieved">Not Achieved</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Slider 
                        value={[goal.progress]} 
                        max={100} 
                        onValueChange={(v) => {
                          setGoals(prev => prev.map(g => 
                            g.id === goal.id ? {...g, progress: v[0]} : g
                          ));
                        }}
                        className="flex-1" 
                      />
                      <span className="text-xs font-medium w-10">{goal.progress}%</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Outcome Measures Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {OUTCOME_MEASURES.slice(0, 4).map(measure => (
                  <div key={measure.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{measure.label}</span>
                      <span className="text-xs text-muted-foreground">{measure.range}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div className="p-2 bg-muted/50 rounded">
                        <p className="text-xs text-muted-foreground">Initial</p>
                        <p className="font-medium">-</p>
                      </div>
                      <div className="p-2 bg-muted/50 rounded">
                        <p className="text-xs text-muted-foreground">Current</p>
                        <p className="font-medium">-</p>
                      </div>
                      <div className="p-2 bg-primary/10 rounded">
                        <p className="text-xs text-muted-foreground">Change</p>
                        <p className="font-medium text-primary">-</p>
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
                <Calendar className="w-5 h-5 text-primary" />
                Session History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No sessions recorded yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {sessions.map((session, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">Session {idx + 1}</Badge>
                        <span className="text-sm">{session.date}</span>
                        <span className="text-sm text-muted-foreground">{session.duration} min</span>
                      </div>
                      <div className="flex gap-1">
                        {session.interventions.slice(0, 3).map(int => (
                          <Badge key={int} variant="secondary" className="text-xs">{int}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="col-span-2 flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("session")}>Back</Button>
            <div className="flex gap-2">
              <Button variant="outline">Generate Report</Button>
              <Button>
                <CheckCircle className="w-4 h-4 mr-2" />
                Discharge Summary
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
