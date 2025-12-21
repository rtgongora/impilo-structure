import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pill,
  Droplets,
  Activity,
  Target,
  ClipboardList,
  CheckCircle2,
  Clock,
  TrendingUp,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { useEHR } from "@/contexts/EHRContext";
import {
  MOCK_MAR,
  MOCK_NURSING_TASKS,
  MOCK_CARE_PLAN,
  MOCK_FLUID_BALANCE,
} from "@/data/mockClinicalData";

function MedicationAdministrationPanel() {
  const marEntries = MOCK_MAR;
  const scheduledCount = marEntries.filter(m => m.status === 'scheduled').length;
  const givenCount = marEntries.filter(m => m.status === 'given').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'given':
        return <Badge className="bg-success text-success-foreground">Given</Badge>;
      case 'scheduled':
        return <Badge variant="outline">Scheduled</Badge>;
      case 'missed':
        return <Badge variant="destructive">Missed</Badge>;
      case 'held':
        return <Badge variant="secondary">Held</Badge>;
      case 'refused':
        return <Badge variant="secondary">Refused</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-center p-3 bg-success/10 rounded-lg">
            <div className="text-2xl font-semibold text-success">{givenCount}</div>
            <div className="text-xs text-muted-foreground">Given</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-semibold">{scheduledCount}</div>
            <div className="text-xs text-muted-foreground">Scheduled</div>
          </div>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Record Administration
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Medication</TableHead>
                <TableHead>Dose</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Given By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marEntries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-sm">
                    {format(entry.scheduledTime, "HH:mm")}
                  </TableCell>
                  <TableCell className="font-medium">{entry.medication}</TableCell>
                  <TableCell>{entry.dose}</TableCell>
                  <TableCell>{entry.route}</TableCell>
                  <TableCell>{getStatusBadge(entry.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entry.administeredBy || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function FluidBalancePanel() {
  const todayBalance = MOCK_FLUID_BALANCE[0];
  const totalIntake = todayBalance.intakeOral + todayBalance.intakeIV + todayBalance.intakeOther;
  const totalOutput = todayBalance.outputUrine + todayBalance.outputStool + todayBalance.outputVomitus + todayBalance.outputDrains;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <Droplets className="w-6 h-6 mx-auto text-primary mb-2" />
            <div className="text-2xl font-semibold">{totalIntake}</div>
            <div className="text-sm text-muted-foreground">Total Intake (ml)</div>
          </CardContent>
        </Card>
        <Card className="bg-warning/5 border-warning/20">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto text-warning mb-2" />
            <div className="text-2xl font-semibold">{totalOutput}</div>
            <div className="text-sm text-muted-foreground">Total Output (ml)</div>
          </CardContent>
        </Card>
        <Card className={`${todayBalance.netBalance >= 0 ? 'bg-success/5 border-success/20' : 'bg-critical/5 border-critical/20'}`}>
          <CardContent className="p-4 text-center">
            <Activity className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
            <div className={`text-2xl font-semibold ${todayBalance.netBalance >= 0 ? 'text-success' : 'text-critical'}`}>
              {todayBalance.netBalance > 0 ? '+' : ''}{todayBalance.netBalance}
            </div>
            <div className="text-sm text-muted-foreground">Net Balance (ml)</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-primary">Intake</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Oral</span>
                <span className="font-mono">{todayBalance.intakeOral} ml</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">IV Fluids</span>
                <span className="font-mono">{todayBalance.intakeIV} ml</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Other (feeds, etc.)</span>
                <span className="font-mono">{todayBalance.intakeOther} ml</span>
              </div>
              <div className="border-t pt-2 flex justify-between items-center font-semibold">
                <span>Total</span>
                <span className="font-mono">{totalIntake} ml</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-warning">Output</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Urine</span>
                <span className="font-mono">{todayBalance.outputUrine} ml</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Stool</span>
                <span className="font-mono">{todayBalance.outputStool} ml</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Vomitus</span>
                <span className="font-mono">{todayBalance.outputVomitus} ml</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Drains</span>
                <span className="font-mono">{todayBalance.outputDrains} ml</span>
              </div>
              <div className="border-t pt-2 flex justify-between items-center font-semibold">
                <span>Total</span>
                <span className="font-mono">{totalOutput} ml</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Record Entry
        </Button>
      </div>
    </div>
  );
}

function NursingTasksPanel() {
  const tasks = MOCK_NURSING_TASKS;
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'vitals': return <Activity className="w-4 h-4" />;
      case 'wound_care': return <Plus className="w-4 h-4" />;
      case 'feeding': return <Droplets className="w-4 h-4" />;
      default: return <ClipboardList className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success text-success-foreground">Done</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'missed':
        return <Badge variant="destructive">Missed</Badge>;
      case 'deferred':
        return <Badge variant="secondary">Deferred</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-center p-3 bg-warning/10 rounded-lg">
            <div className="text-2xl font-semibold text-warning">{pendingCount}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="text-center p-3 bg-success/10 rounded-lg">
            <div className="text-2xl font-semibold text-success">{completedCount}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      <div className="space-y-2">
        {tasks.map(task => (
          <Card key={task.id} className={task.status === 'pending' ? 'border-warning/30' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${task.status === 'completed' ? 'bg-success/10' : 'bg-muted'}`}>
                    {getTaskIcon(task.type)}
                  </div>
                  <div>
                    <div className="font-medium">{task.description}</div>
                    <div className="text-xs text-muted-foreground">
                      Due: {format(task.dueTime, "HH:mm")}
                      {task.completedBy && ` • Completed by ${task.completedBy}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(task.status)}
                  {task.status === 'pending' && (
                    <Button size="sm">Complete</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CarePlanPanel() {
  const plan = MOCK_CARE_PLAN;

  return (
    <div className="space-y-4">
      {/* Care Goals */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4" />
              Care Goals
            </CardTitle>
            <Button variant="ghost" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Goal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {plan.goals.map((goal, index) => (
              <div key={goal.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  goal.status === 'achieved' ? 'bg-success text-success-foreground' :
                  goal.status === 'active' ? 'bg-primary text-primary-foreground' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{goal.description}</span>
                    <Badge variant={goal.status === 'achieved' ? 'default' : 'outline'}>
                      {goal.status}
                    </Badge>
                  </div>
                  {goal.targetDate && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Target: {format(goal.targetDate, "dd MMM yyyy")}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Interventions */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Active Interventions
            </CardTitle>
            <Button variant="ghost" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Intervention</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Responsible</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plan.interventions.map(intervention => (
                <TableRow key={intervention.id}>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {intervention.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{intervention.description}</TableCell>
                  <TableCell className="text-sm">{intervention.frequency || "—"}</TableCell>
                  <TableCell className="text-sm">{intervention.responsibleCadre || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={intervention.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                      {intervention.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Review Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-muted-foreground">Next Review: </span>
              <span className="font-medium">{plan.reviewDate && format(plan.reviewDate, "dd MMM yyyy")}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Responsible: </span>
              <span className="font-medium">{plan.responsibleTeam}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Created by: </span>
              <span className="font-medium">{plan.createdBy}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function CareSection() {
  const { currentEncounter } = useEHR();
  const isInpatient = currentEncounter.type === "inpatient";

  return (
    <Tabs defaultValue={isInpatient ? "mar" : "plan"} className="space-y-4">
      <TabsList className="flex-wrap">
        {isInpatient && (
          <>
            <TabsTrigger value="mar" className="flex items-center gap-2">
              <Pill className="w-4 h-4" />
              Medication Administration
            </TabsTrigger>
            <TabsTrigger value="fluids" className="flex items-center gap-2">
              <Droplets className="w-4 h-4" />
              Fluid Balance
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Nursing Tasks
            </TabsTrigger>
          </>
        )}
        <TabsTrigger value="plan" className="flex items-center gap-2">
          <Target className="w-4 h-4" />
          Care Plan
        </TabsTrigger>
      </TabsList>

      {isInpatient && (
        <>
          <TabsContent value="mar">
            <MedicationAdministrationPanel />
          </TabsContent>
          <TabsContent value="fluids">
            <FluidBalancePanel />
          </TabsContent>
          <TabsContent value="tasks">
            <NursingTasksPanel />
          </TabsContent>
        </>
      )}
      
      <TabsContent value="plan">
        <CarePlanPanel />
      </TabsContent>
    </Tabs>
  );
}
