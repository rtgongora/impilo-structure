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
  Brain, AlertTriangle, Clock, User, Plus, 
  ChevronRight, CheckCircle, FileText, Calendar,
  Shield, Heart, Target, MessageCircle, BookOpen, AlertCircle
} from "lucide-react";
import { useState } from "react";

interface SessionNote {
  date: string;
  sessionNumber: number;
  moodRating: number;
  themes: string[];
  interventions: string[];
  homework: string;
  riskLevel: "none" | "low" | "moderate" | "high";
  nextSession: string;
}

interface SafetyPlanItem {
  category: string;
  items: string[];
}

const REFERRAL_REASONS = [
  "Depression", "Anxiety", "PTSD", "OCD", "Bipolar Disorder",
  "Personality Disorder", "Eating Disorder", "Grief/Loss",
  "Relationship Issues", "Substance Use", "Trauma", "Self-Harm",
  "Suicidal Ideation", "Adjustment Disorder", "Anger Management"
];

const THERAPY_MODALITIES = [
  { id: "cbt", label: "CBT", description: "Cognitive Behavioral Therapy" },
  { id: "dbt", label: "DBT", description: "Dialectical Behavior Therapy" },
  { id: "emdr", label: "EMDR", description: "Eye Movement Desensitization" },
  { id: "psychodynamic", label: "Psychodynamic", description: "Insight-oriented therapy" },
  { id: "act", label: "ACT", description: "Acceptance & Commitment Therapy" },
  { id: "mi", label: "MI", description: "Motivational Interviewing" },
  { id: "schema", label: "Schema Therapy", description: "Schema-focused approach" },
  { id: "family", label: "Family Therapy", description: "Systemic family therapy" },
];

const SESSION_THEMES = [
  "Mood", "Anxiety", "Relationships", "Self-esteem", "Trauma",
  "Grief", "Anger", "Sleep", "Motivation", "Work/School",
  "Family", "Coping Skills", "Substance Use", "Self-harm", "Safety"
];

const INTERVENTIONS = [
  "Psychoeducation", "Cognitive Restructuring", "Behavioral Activation",
  "Exposure", "Mindfulness", "Grounding Techniques", "Emotion Regulation",
  "Distress Tolerance", "Interpersonal Effectiveness", "Safety Planning",
  "Crisis Intervention", "Goal Setting", "Problem Solving", "Relaxation",
  "Journaling", "Homework Review"
];

const RISK_ASSESSMENT_ITEMS = [
  { id: "si", label: "Suicidal ideation", severity: "high" },
  { id: "plan", label: "Suicidal plan", severity: "high" },
  { id: "intent", label: "Intent to act", severity: "high" },
  { id: "means", label: "Access to means", severity: "high" },
  { id: "sh", label: "Self-harm urges/behavior", severity: "moderate" },
  { id: "hopelessness", label: "Hopelessness", severity: "moderate" },
  { id: "hi", label: "Homicidal ideation", severity: "high" },
  { id: "substance", label: "Substance use", severity: "moderate" },
  { id: "impulsivity", label: "Impulsivity", severity: "moderate" },
];

const SAFETY_PLAN_CATEGORIES = [
  "Warning Signs",
  "Coping Strategies",
  "Social Contacts for Distraction",
  "Family/Friends for Help",
  "Professional Contacts",
  "Making Environment Safe"
];

export function PsychotherapyWorkspace() {
  const [currentPhase, setCurrentPhase] = useState<"assessment" | "risk" | "session" | "safety">("assessment");
  const [selectedModalities, setSelectedModalities] = useState<string[]>([]);
  const [moodRating, setMoodRating] = useState([5]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [selectedInterventions, setSelectedInterventions] = useState<string[]>([]);
  const [riskItems, setRiskItems] = useState<string[]>([]);
  const [sessions, setSessions] = useState<SessionNote[]>([]);
  const [safetyPlan, setSafetyPlan] = useState<SafetyPlanItem[]>(
    SAFETY_PLAN_CATEGORIES.map(cat => ({ category: cat, items: [] }))
  );

  const toggleModality = (id: string) => {
    setSelectedModalities(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const toggleTheme = (theme: string) => {
    setSelectedThemes(prev => 
      prev.includes(theme) ? prev.filter(t => t !== theme) : [...prev, theme]
    );
  };

  const toggleIntervention = (intervention: string) => {
    setSelectedInterventions(prev => 
      prev.includes(intervention) ? prev.filter(i => i !== intervention) : [...prev, intervention]
    );
  };

  const toggleRiskItem = (id: string) => {
    setRiskItems(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const getRiskLevel = () => {
    const highRiskCount = riskItems.filter(id => 
      RISK_ASSESSMENT_ITEMS.find(item => item.id === id)?.severity === "high"
    ).length;
    if (highRiskCount >= 2) return "high";
    if (highRiskCount === 1 || riskItems.length >= 3) return "moderate";
    if (riskItems.length > 0) return "low";
    return "none";
  };

  const phases = [
    { id: "assessment", label: "Initial Assessment" },
    { id: "risk", label: "Risk Assessment" },
    { id: "session", label: "Session Notes" },
    { id: "safety", label: "Safety Plan" },
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

      {/* Risk Level Banner */}
      {getRiskLevel() !== "none" && (
        <Card className={`border-2 ${
          getRiskLevel() === "high" ? "border-destructive bg-destructive/5" :
          getRiskLevel() === "moderate" ? "border-warning bg-warning/5" :
          "border-yellow-500/50 bg-yellow-500/5"
        }`}>
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className={`w-5 h-5 ${
                  getRiskLevel() === "high" ? "text-destructive" :
                  getRiskLevel() === "moderate" ? "text-warning" :
                  "text-yellow-600"
                }`} />
                <span className="font-medium">
                  Risk Level: <Badge variant={getRiskLevel() === "high" ? "destructive" : "outline"}>
                    {getRiskLevel().toUpperCase()}
                  </Badge>
                </span>
              </div>
              <Button size="sm" variant="outline" onClick={() => setCurrentPhase("safety")}>
                <Shield className="w-4 h-4 mr-1" />
                Review Safety Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assessment Phase */}
      {currentPhase === "assessment" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Presenting Problems
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">Primary Reason for Referral</Label>
                <select className="w-full mt-1 border rounded-lg p-2">
                  <option value="">Select...</option>
                  {REFERRAL_REASONS.map(reason => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-sm">Chief Complaint (Patient's Words)</Label>
                <Textarea placeholder="What brings you here today?" className="mt-1" />
              </div>

              <div>
                <Label className="text-sm">History of Present Illness</Label>
                <Textarea placeholder="Onset, duration, course, triggers, previous treatment..." className="mt-1" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Previous Therapy</Label>
                  <select className="w-full mt-1 border rounded-lg p-2">
                    <option>None</option>
                    <option>Yes - Helpful</option>
                    <option>Yes - Not Helpful</option>
                    <option>Yes - Partially Helpful</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm">Current Medications</Label>
                  <Input placeholder="List psychiatric meds..." className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Mental Status Exam
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Appearance", options: ["Well-groomed", "Disheveled", "Unusual"] },
                { label: "Behavior", options: ["Cooperative", "Guarded", "Agitated", "Withdrawn"] },
                { label: "Speech", options: ["Normal", "Pressured", "Slow", "Monotone"] },
                { label: "Mood", options: ["Euthymic", "Depressed", "Anxious", "Irritable", "Euphoric"] },
                { label: "Affect", options: ["Appropriate", "Flat", "Blunted", "Labile", "Incongruent"] },
                { label: "Thought Process", options: ["Logical", "Tangential", "Circumstantial", "Disorganized"] },
                { label: "Insight", options: ["Good", "Fair", "Poor"] },
                { label: "Judgment", options: ["Good", "Fair", "Poor"] },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <Label className="text-xs w-28">{item.label}</Label>
                  <select className="flex-1 border rounded p-1 text-sm">
                    {item.options.map(opt => <option key={opt}>{opt}</option>)}
                  </select>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Treatment Approach
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">Therapy Modalities</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {THERAPY_MODALITIES.map(modality => (
                    <div
                      key={modality.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedModalities.includes(modality.id) 
                          ? "border-primary bg-primary/5" 
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => toggleModality(modality.id)}
                    >
                      <span className="font-medium text-sm">{modality.label}</span>
                      <p className="text-xs text-muted-foreground">{modality.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Session Frequency</Label>
                  <select className="w-full mt-1 border rounded-lg p-2">
                    <option>Weekly</option>
                    <option>Biweekly</option>
                    <option>Monthly</option>
                    <option>As needed</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm">Estimated Duration</Label>
                  <select className="w-full mt-1 border rounded-lg p-2">
                    <option>Short-term (8-12 sessions)</option>
                    <option>Medium-term (12-24 sessions)</option>
                    <option>Long-term (24+ sessions)</option>
                    <option>Open-ended</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-sm">Initial Treatment Goals</Label>
                <Textarea placeholder="Collaborative goals with patient..." className="mt-1" />
              </div>

              <Button onClick={() => setCurrentPhase("risk")}>
                Proceed to Risk Assessment
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Risk Assessment Phase */}
      {currentPhase === "risk" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                Risk Factors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {RISK_ASSESSMENT_ITEMS.map(item => (
                <div 
                  key={item.id} 
                  className={`flex items-center gap-3 p-2 rounded-lg border ${
                    riskItems.includes(item.id) 
                      ? item.severity === "high" ? "border-destructive bg-destructive/10" : "border-warning bg-warning/10"
                      : ""
                  }`}
                >
                  <Checkbox
                    id={item.id}
                    checked={riskItems.includes(item.id)}
                    onCheckedChange={() => toggleRiskItem(item.id)}
                  />
                  <Label htmlFor={item.id} className="text-sm cursor-pointer flex-1">
                    {item.label}
                  </Label>
                  <Badge variant={item.severity === "high" ? "destructive" : "secondary"} className="text-xs">
                    {item.severity}
                  </Badge>
                </div>
              ))}

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Overall Risk Level:</span>
                  <Badge 
                    variant={getRiskLevel() === "high" ? "destructive" : getRiskLevel() === "moderate" ? "default" : "outline"}
                    className="text-sm"
                  >
                    {getRiskLevel().toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Protective Factors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "Strong social support",
                "Engaged in treatment",
                "Future-oriented thinking",
                "Reasons for living",
                "Religious/spiritual beliefs",
                "Responsibility to family/children",
                "Fear of death/dying",
                "Problem-solving skills",
                "Access to mental health care",
                "Stable housing/employment"
              ].map(factor => (
                <div key={factor} className="flex items-center gap-3">
                  <Checkbox />
                  <Label className="text-sm cursor-pointer">{factor}</Label>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Risk Assessment Documentation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Previous Suicide Attempts</Label>
                  <select className="w-full mt-1 border rounded-lg p-2">
                    <option>None</option>
                    <option>1</option>
                    <option>2-3</option>
                    <option>More than 3</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm">Family History of Suicide</Label>
                  <select className="w-full mt-1 border rounded-lg p-2">
                    <option>None known</option>
                    <option>Yes</option>
                    <option>Unknown</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-sm">Risk Assessment Summary</Label>
                <Textarea placeholder="Detailed narrative of risk assessment..." className="mt-1" />
              </div>

              <div>
                <Label className="text-sm">Safety Plan Status</Label>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="cursor-pointer">Not Started</Badge>
                  <Badge variant="secondary" className="cursor-pointer">In Progress</Badge>
                  <Badge variant="default" className="cursor-pointer">Completed</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="col-span-2 flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("assessment")}>Back</Button>
            <div className="flex gap-2">
              {getRiskLevel() !== "none" && (
                <Button variant="outline" onClick={() => setCurrentPhase("safety")}>
                  <Shield className="w-4 h-4 mr-2" />
                  Create Safety Plan
                </Button>
              )}
              <Button onClick={() => setCurrentPhase("session")}>
                Session Notes
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Session Notes Phase */}
      {currentPhase === "session" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                Session {sessions.length + 1}
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
                  <Input type="number" placeholder="50" className="mt-1" />
                </div>
              </div>

              <div>
                <Label className="text-sm">Current Mood (0-10): {moodRating[0]}</Label>
                <Slider
                  value={moodRating}
                  onValueChange={setMoodRating}
                  max={10}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Very Low</span>
                  <span>Neutral</span>
                  <span>Very High</span>
                </div>
              </div>

              <div>
                <Label className="text-sm">Session Themes</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {SESSION_THEMES.map(theme => (
                    <Badge
                      key={theme}
                      variant={selectedThemes.includes(theme) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTheme(theme)}
                    >
                      {theme}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm">Interventions Used</Label>
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
                Session Documentation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">Session Content</Label>
                <Textarea 
                  placeholder="Key discussion points, insights, progress observed..." 
                  className="mt-1 min-h-[120px]" 
                />
              </div>

              <div>
                <Label className="text-sm">Patient Response</Label>
                <Textarea placeholder="Engagement, affect during session, receptivity..." className="mt-1" />
              </div>

              <div>
                <Label className="text-sm">Homework/Between-Session Work</Label>
                <Textarea placeholder="Assignments given for next session..." className="mt-1" />
              </div>

              <div>
                <Label className="text-sm">Risk Reassessment</Label>
                <select className="w-full mt-1 border rounded-lg p-2">
                  <option>No change from baseline</option>
                  <option>Decreased risk</option>
                  <option>Increased risk - safety plan reviewed</option>
                  <option>Increased risk - intervention required</option>
                </select>
              </div>

              <div>
                <Label className="text-sm">Plan for Next Session</Label>
                <Textarea placeholder="Focus areas, goals, interventions planned..." className="mt-1" />
              </div>
            </CardContent>
          </Card>

          <div className="col-span-2 flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("risk")}>Back</Button>
            <div className="flex gap-2">
              <Button variant="outline">Save Session</Button>
              <Button onClick={() => setCurrentPhase("safety")}>
                Safety Plan
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Safety Plan Phase */}
      {currentPhase === "safety" && (
        <div className="space-y-6">
          <Card className="border-2 border-primary">
            <CardHeader className="pb-3 bg-primary/5">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Safety Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-6">
                {SAFETY_PLAN_CATEGORIES.map((category, idx) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <Label className="font-medium">{category}</Label>
                    </div>
                    <Textarea 
                      placeholder={`List ${category.toLowerCase()}...`}
                      className="min-h-[80px]"
                      value={safetyPlan.find(s => s.category === category)?.items.join('\n') || ''}
                      onChange={(e) => {
                        setSafetyPlan(prev => prev.map(s => 
                          s.category === category 
                            ? {...s, items: e.target.value.split('\n').filter(i => i.trim())}
                            : s
                        ));
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                <Label className="font-medium">Emergency Contacts</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div>
                    <Label className="text-xs">Crisis Line</Label>
                    <Input placeholder="988 (Suicide & Crisis Lifeline)" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Therapist</Label>
                    <Input placeholder="Therapist phone number" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Emergency</Label>
                    <Input placeholder="911 or local emergency" className="mt-1" />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <Checkbox id="patient-copy" />
                <Label htmlFor="patient-copy" className="text-sm">Patient has received a copy of safety plan</Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("session")}>Back</Button>
            <div className="flex gap-2">
              <Button variant="outline">Print Safety Plan</Button>
              <Button>
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete & Sign
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
