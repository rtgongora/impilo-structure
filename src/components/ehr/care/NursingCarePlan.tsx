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
  Stethoscope
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { TreatmentGoals } from "./TreatmentGoals";
import { NursingInterventions } from "./NursingInterventions";
import { useCarePlans, CarePlanItem } from "@/hooks/useCarePlanData";

export function NursingCarePlan() {
  const { carePlans, loading, refetch } = useCarePlans();
  const [activeTab, setActiveTab] = useState("overview");
  const [diagnosesExpanded, setDiagnosesExpanded] = useState(false);

  // Get the first active care plan for display
  const activePlan = carePlans.find(p => p.status === "active") || carePlans[0];
  const planItems: CarePlanItem[] = activePlan?.items || [];

  // Calculate progress from items
  const completedItems = planItems.filter(item => item.status === "completed").length;
  const totalItems = planItems.length;
  const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Group items by type
  const goals = planItems.filter(item => item.item_type === "goal");
  const interventions = planItems.filter(item => item.item_type === "intervention");
  const diagnoses = planItems.filter(item => item.item_type === "diagnosis");

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!activePlan) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Active Care Plan</h3>
          <p className="text-muted-foreground mb-4">Create a new care plan to start documenting patient care.</p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Care Plan
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Care Plan Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-xl">{activePlan.title}</CardTitle>
                <Badge 
                  variant={activePlan.status === "active" ? "default" : "secondary"}
                  className={activePlan.status === "active" ? "bg-success" : ""}
                >
                  {activePlan.status.charAt(0).toUpperCase() + activePlan.status.slice(1)}
                </Badge>
              </div>
              <CardDescription>
                {activePlan.patient?.first_name} {activePlan.patient?.last_name} • Created {format(new Date(activePlan.created_at), "dd MMM yyyy")}
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
                <Calendar className="w-4 h-4" />
                Start Date
              </div>
              <div className="font-medium">{format(new Date(activePlan.start_date), "dd MMM yyyy")}</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="w-4 h-4" />
                End Date
              </div>
              <div className="font-medium">{activePlan.end_date ? format(new Date(activePlan.end_date), "dd MMM yyyy") : "Ongoing"}</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Target className="w-4 h-4" />
                Goals
              </div>
              <div className="font-medium">{goals.length} goals</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Activity className="w-4 h-4" />
                Interventions
              </div>
              <div className="font-medium">{interventions.length} interventions</div>
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
              <span>{completedItems} of {totalItems} items completed</span>
              {activePlan.end_date && <span>Target: {format(new Date(activePlan.end_date), "dd MMM")}</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diagnoses */}
      {diagnoses.length > 0 && (
        <Collapsible open={diagnosesExpanded} onOpenChange={setDiagnosesExpanded}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                    <CardTitle className="text-base">Care Plan Diagnoses</CardTitle>
                    <Badge variant="outline">{diagnoses.length}</Badge>
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
                  {diagnoses.map((diagnosis) => (
                    <div 
                      key={diagnosis.id}
                      className="p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant="outline" className="text-xs mb-1">
                            {diagnosis.priority || "standard"}
                          </Badge>
                          <h4 className="font-medium">{diagnosis.title}</h4>
                          {diagnosis.description && (
                            <p className="text-sm text-muted-foreground mt-1">{diagnosis.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Goals ({goals.length})
          </TabsTrigger>
          <TabsTrigger value="interventions" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Interventions ({interventions.length})
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
                {goals.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No goals defined yet</p>
                ) : (
                  <div className="space-y-3">
                    {goals.slice(0, 4).map((goal) => {
                      const progress = goal.status === "completed" ? 100 : goal.status === "active" ? 50 : 0;
                      return (
                        <div key={goal.id} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{goal.title}</span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                )}
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
                  Plan Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                {planItems.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No items in this care plan</p>
                ) : (
                  <div className="space-y-3">
                    {planItems.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center gap-3 text-sm">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          item.status === "completed" ? "bg-green-500" : 
                          item.status === "active" ? "bg-blue-500" : "bg-gray-300"
                        )} />
                        <div className="flex-1">
                          <span className="font-medium">{item.title}</span>
                          <span className="text-muted-foreground ml-2 text-xs">{item.item_type}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">{item.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
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
          <Card>
            <CardContent className="p-8 text-center">
              <Check className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">Care Plan Evaluations</h3>
              <p className="text-muted-foreground mb-4">Document evaluations and progress notes for this care plan.</p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Evaluation
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
