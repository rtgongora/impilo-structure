import { useState } from "react";
import {
  FileText,
  Calendar,
  User,
  Target,
  Activity,
  AlertTriangle,
  Check,
  Clock,
  Plus,
  Edit,
  Printer,
  Share2,
  ChevronDown,
  ChevronUp,
  Heart,
  Stethoscope
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { TreatmentGoals, TreatmentGoal } from "./TreatmentGoals";
import { NursingInterventions, NursingIntervention } from "./NursingInterventions";

export interface CarePlan {
  id: string;
  patientId: string;
  patientName: string;
  status: "draft" | "active" | "completed" | "discontinued";
  type: "nursing" | "interdisciplinary" | "discharge";
  createdDate: Date;
  lastReviewDate: Date;
  nextReviewDate: Date;
  createdBy: string;
  primaryNurse: string;
  attendingPhysician: string;
  diagnoses: CarePlanDiagnosis[];
  goals: TreatmentGoal[];
  interventions: NursingIntervention[];
  evaluations: CarePlanEvaluation[];
}

interface CarePlanDiagnosis {
  id: string;
  code: string;
  description: string;
  type: "primary" | "secondary";
  relatedFactors?: string[];
  evidence?: string[];
}

interface CarePlanEvaluation {
  id: string;
  date: Date;
  evaluator: string;
  overallStatus: "progressing" | "achieved" | "regressed" | "unchanged";
  notes: string;
  goalsReviewed: string[];
}

const MOCK_CARE_PLAN: CarePlan = {
  id: "CP001",
  patientId: "P001",
  patientName: "Sarah M. Johnson",
  status: "active",
  type: "interdisciplinary",
  createdDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  lastReviewDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  nextReviewDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  createdBy: "Dr. James Mwangi",
  primaryNurse: "RN Tendai Moyo",
  attendingPhysician: "Dr. James Mwangi",
  diagnoses: [
    {
      id: "D001",
      code: "E11.9",
      description: "Type 2 Diabetes Mellitus without complications",
      type: "primary",
      relatedFactors: ["Obesity", "Sedentary lifestyle", "Family history"],
      evidence: ["HbA1c 8.5%", "Fasting glucose 180 mg/dL"]
    },
    {
      id: "D002",
      code: "I10",
      description: "Essential Hypertension",
      type: "secondary",
      relatedFactors: ["Stress", "High sodium diet"],
      evidence: ["BP 152/94 mmHg on admission"]
    },
    {
      id: "D003",
      code: "00085",
      description: "Impaired Physical Mobility",
      type: "secondary",
      relatedFactors: ["Post-surgical status", "Pain"],
      evidence: ["Unable to ambulate independently"]
    }
  ],
  goals: [],
  interventions: [],
  evaluations: [
    {
      id: "E001",
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      evaluator: "RN Tendai Moyo",
      overallStatus: "progressing",
      notes: "Patient showing improvement in mobility. Blood glucose levels stabilizing with current regimen. Continues to require education on insulin self-administration.",
      goalsReviewed: ["G001", "G002", "G003"]
    }
  ]
};

export function NursingCarePlan() {
  const [carePlan] = useState<CarePlan>(MOCK_CARE_PLAN);
  const [activeTab, setActiveTab] = useState("overview");
  const [diagnosesExpanded, setDiagnosesExpanded] = useState(false);

  const overallProgress = 55; // Calculated from goals

  return (
    <div className="space-y-6">
      {/* Care Plan Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-xl">Interdisciplinary Care Plan</CardTitle>
                <Badge 
                  variant={carePlan.status === "active" ? "default" : "secondary"}
                  className={carePlan.status === "active" ? "bg-success" : ""}
                >
                  {carePlan.status.charAt(0).toUpperCase() + carePlan.status.slice(1)}
                </Badge>
              </div>
              <CardDescription>
                {carePlan.patientName} • Created {format(carePlan.createdDate, "dd MMM yyyy")}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Printer className="w-4 h-4 mr-1" />
                Print
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
              <Button size="sm">
                <Edit className="w-4 h-4 mr-1" />
                Edit Plan
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <User className="w-4 h-4" />
                Primary Nurse
              </div>
              <div className="font-medium">{carePlan.primaryNurse}</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Stethoscope className="w-4 h-4" />
                Attending Physician
              </div>
              <div className="font-medium">{carePlan.attendingPhysician}</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                Last Review
              </div>
              <div className="font-medium">{format(carePlan.lastReviewDate, "dd MMM yyyy")}</div>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="w-4 h-4" />
                Next Review
              </div>
              <div className="font-medium text-primary">{format(carePlan.nextReviewDate, "dd MMM yyyy")}</div>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Care Plan Progress</span>
              <span className="text-sm font-bold text-primary">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>4 of 7 goals on track</span>
              <span>Estimated completion: {format(carePlan.nextReviewDate, "dd MMM")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diagnoses */}
      <Collapsible open={diagnosesExpanded} onOpenChange={setDiagnosesExpanded}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  <CardTitle className="text-base">Active Diagnoses</CardTitle>
                  <Badge variant="outline">{carePlan.diagnoses.length}</Badge>
                </div>
                {diagnosesExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {carePlan.diagnoses.map((diagnosis) => (
                  <div 
                    key={diagnosis.id}
                    className={cn(
                      "p-3 rounded-lg border",
                      diagnosis.type === "primary" 
                        ? "bg-primary/5 border-primary/30" 
                        : "bg-muted/30 border-muted"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={diagnosis.type === "primary" ? "default" : "outline"}
                            className="text-xs"
                          >
                            {diagnosis.type}
                          </Badge>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {diagnosis.code}
                          </code>
                        </div>
                        <h4 className="font-medium mt-1">{diagnosis.description}</h4>
                      </div>
                    </div>
                    {diagnosis.relatedFactors && (
                      <div className="mt-2 text-sm">
                        <span className="text-muted-foreground">Related factors: </span>
                        {diagnosis.relatedFactors.join(", ")}
                      </div>
                    )}
                    {diagnosis.evidence && (
                      <div className="mt-1 text-sm">
                        <span className="text-muted-foreground">Evidence: </span>
                        {diagnosis.evidence.join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Goals
          </TabsTrigger>
          <TabsTrigger value="interventions" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Interventions
          </TabsTrigger>
          <TabsTrigger value="evaluations" className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            Evaluations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Goals Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Treatment Goals Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: "Blood Pressure Control", progress: 65, status: "in-progress" },
                    { label: "Independent Mobility", progress: 40, status: "in-progress" },
                    { label: "Diabetes Self-Management", progress: 75, status: "in-progress" },
                    { label: "Safe Discharge Readiness", progress: 0, status: "not-started" },
                  ].map((goal, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{goal.label}</span>
                        <span className="font-medium">{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-4" onClick={() => setActiveTab("goals")}>
                  View All Goals
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { action: "Vital signs documented", time: "2 hours ago", user: "RN Tendai" },
                    { action: "Insulin administered", time: "4 hours ago", user: "RN Tendai" },
                    { action: "Care plan reviewed", time: "1 day ago", user: "RN Tendai" },
                    { action: "Milestone completed", time: "1 day ago", user: "PT Sarah" },
                    { action: "Progress note added", time: "2 days ago", user: "Dr. Mwangi" },
                  ].map((activity, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <div className="flex-1">
                        <span className="font-medium">{activity.action}</span>
                        <span className="text-muted-foreground ml-2">by {activity.user}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="mt-4">
          <TreatmentGoals />
        </TabsContent>

        <TabsContent value="interventions" className="mt-4">
          <NursingInterventions />
        </TabsContent>

        <TabsContent value="evaluations" className="mt-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Care Plan Evaluations</h3>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Evaluation
              </Button>
            </div>
            
            {carePlan.evaluations.map(evaluation => (
              <Card key={evaluation.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{format(evaluation.date, "dd MMM yyyy HH:mm")}</h4>
                        <Badge 
                          variant={evaluation.overallStatus === "progressing" ? "default" : "secondary"}
                          className={evaluation.overallStatus === "progressing" ? "bg-success" : ""}
                        >
                          {evaluation.overallStatus.charAt(0).toUpperCase() + evaluation.overallStatus.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Evaluated by {evaluation.evaluator}</p>
                    </div>
                  </div>
                  <p className="text-sm">{evaluation.notes}</p>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Goals reviewed: {evaluation.goalsReviewed.length}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
