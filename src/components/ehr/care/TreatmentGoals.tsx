import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Plus,
  Check,
  Clock,
  AlertCircle,
  TrendingUp,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface TreatmentGoal {
  id: string;
  category: "clinical" | "functional" | "behavioral" | "educational" | "discharge";
  title: string;
  description: string;
  targetValue?: string;
  currentValue?: string;
  unit?: string;
  status: "not-started" | "in-progress" | "achieved" | "not-achieved" | "modified";
  priority: "high" | "medium" | "low";
  targetDate: Date;
  createdDate: Date;
  createdBy: string;
  progress: number;
  milestones: GoalMilestone[];
  notes: GoalNote[];
}

interface GoalMilestone {
  id: string;
  description: string;
  targetDate: Date;
  completed: boolean;
  completedDate?: Date;
}

interface GoalNote {
  id: string;
  text: string;
  author: string;
  timestamp: Date;
}

const MOCK_GOALS: TreatmentGoal[] = [
  {
    id: "G001",
    category: "clinical",
    title: "Blood Pressure Control",
    description: "Achieve and maintain blood pressure below 140/90 mmHg",
    targetValue: "140/90",
    currentValue: "152/94",
    unit: "mmHg",
    status: "in-progress",
    priority: "high",
    targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    createdBy: "Dr. James Mwangi",
    progress: 65,
    milestones: [
      { id: "M1", description: "Start antihypertensive medication", targetDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), completed: true, completedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { id: "M2", description: "Reduce sodium intake", targetDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), completed: true, completedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { id: "M3", description: "BP consistently < 150/95", targetDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), completed: false },
      { id: "M4", description: "Target BP achieved", targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), completed: false },
    ],
    notes: [
      { id: "N1", text: "Patient responding well to Amlodipine 5mg", author: "Dr. Mwangi", timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    ]
  },
  {
    id: "G002",
    category: "functional",
    title: "Independent Mobility",
    description: "Patient to ambulate independently with walker for 50 meters",
    targetValue: "50",
    currentValue: "20",
    unit: "meters",
    status: "in-progress",
    priority: "medium",
    targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    createdDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    createdBy: "PT Sarah Ndlovu",
    progress: 40,
    milestones: [
      { id: "M1", description: "Bed to chair transfer with assistance", targetDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), completed: true },
      { id: "M2", description: "Stand with walker for 2 minutes", targetDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), completed: true },
      { id: "M3", description: "Walk 20 meters with minimal assistance", targetDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), completed: false },
    ],
    notes: []
  },
  {
    id: "G003",
    category: "educational",
    title: "Diabetes Self-Management",
    description: "Patient demonstrates correct insulin administration and blood glucose monitoring",
    status: "in-progress",
    priority: "high",
    targetDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    createdDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    createdBy: "RN Tendai Moyo",
    progress: 75,
    milestones: [
      { id: "M1", description: "Verbalize understanding of diabetes", targetDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), completed: true },
      { id: "M2", description: "Demonstrate glucometer use", targetDate: new Date(), completed: true },
      { id: "M3", description: "Demonstrate insulin injection technique", targetDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), completed: false },
    ],
    notes: []
  },
  {
    id: "G004",
    category: "discharge",
    title: "Safe Discharge Readiness",
    description: "Patient meets all discharge criteria and has support system in place",
    status: "not-started",
    priority: "medium",
    targetDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    createdDate: new Date(),
    createdBy: "Dr. James Mwangi",
    progress: 0,
    milestones: [
      { id: "M1", description: "Family education completed", targetDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), completed: false },
      { id: "M2", description: "Follow-up appointments scheduled", targetDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), completed: false },
      { id: "M3", description: "Discharge medications dispensed", targetDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), completed: false },
    ],
    notes: []
  },
];

const categoryConfig = {
  clinical: { label: "Clinical", color: "bg-blue-500", icon: TrendingUp },
  functional: { label: "Functional", color: "bg-green-500", icon: Target },
  behavioral: { label: "Behavioral", color: "bg-purple-500", icon: User },
  educational: { label: "Educational", color: "bg-orange-500", icon: BarChart3 },
  discharge: { label: "Discharge", color: "bg-cyan-500", icon: Calendar },
};

const statusConfig = {
  "not-started": { label: "Not Started", variant: "secondary" as const },
  "in-progress": { label: "In Progress", variant: "default" as const },
  "achieved": { label: "Achieved", variant: "outline" as const, className: "bg-success/10 text-success border-success" },
  "not-achieved": { label: "Not Achieved", variant: "destructive" as const },
  "modified": { label: "Modified", variant: "outline" as const },
};

interface TreatmentGoalsProps {
  goals?: TreatmentGoal[];
  onGoalAdd?: (goal: TreatmentGoal) => void;
  onGoalUpdate?: (goal: TreatmentGoal) => void;
}

export function TreatmentGoals({ goals: propGoals, onGoalAdd, onGoalUpdate }: TreatmentGoalsProps) {
  const [goals, setGoals] = useState<TreatmentGoal[]>(propGoals || MOCK_GOALS);
  const [expandedGoals, setExpandedGoals] = useState<string[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const toggleExpand = (goalId: string) => {
    setExpandedGoals(prev =>
      prev.includes(goalId) ? prev.filter(id => id !== goalId) : [...prev, goalId]
    );
  };

  const handleMilestoneComplete = (goalId: string, milestoneId: string) => {
    setGoals(prev => prev.map(goal => {
      if (goal.id !== goalId) return goal;
      
      const updatedMilestones = goal.milestones.map(m => 
        m.id === milestoneId ? { ...m, completed: true, completedDate: new Date() } : m
      );
      const completedCount = updatedMilestones.filter(m => m.completed).length;
      const progress = Math.round((completedCount / updatedMilestones.length) * 100);
      
      return { ...goal, milestones: updatedMilestones, progress };
    }));
    toast.success("Milestone completed");
  };

  const handleAddGoal = (newGoal: Partial<TreatmentGoal>) => {
    const goal: TreatmentGoal = {
      id: `G${Date.now()}`,
      category: newGoal.category || "clinical",
      title: newGoal.title || "",
      description: newGoal.description || "",
      status: "not-started",
      priority: newGoal.priority || "medium",
      targetDate: newGoal.targetDate || new Date(),
      createdDate: new Date(),
      createdBy: "Current User",
      progress: 0,
      milestones: [],
      notes: [],
    };
    setGoals(prev => [...prev, goal]);
    setShowAddDialog(false);
    toast.success("Goal added successfully");
  };

  const filteredGoals = filter === "all" 
    ? goals 
    : goals.filter(g => g.category === filter || g.status === filter);

  const stats = {
    total: goals.length,
    inProgress: goals.filter(g => g.status === "in-progress").length,
    achieved: goals.filter(g => g.status === "achieved").length,
    overdue: goals.filter(g => g.targetDate < new Date() && g.status !== "achieved").length,
  };

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="bg-muted/30">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Goals</div>
          </CardContent>
        </Card>
        <Card className="bg-primary/10 border-primary/30">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-primary">{stats.inProgress}</div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card className="bg-success/10 border-success/30">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-success">{stats.achieved}</div>
            <div className="text-xs text-muted-foreground">Achieved</div>
          </CardContent>
        </Card>
        <Card className={cn("border-destructive/30", stats.overdue > 0 ? "bg-destructive/10" : "bg-muted/30")}>
          <CardContent className="p-3 text-center">
            <div className={cn("text-2xl font-bold", stats.overdue > 0 && "text-destructive")}>{stats.overdue}</div>
            <div className="text-xs text-muted-foreground">Overdue</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Goals</SelectItem>
              <SelectItem value="clinical">Clinical</SelectItem>
              <SelectItem value="functional">Functional</SelectItem>
              <SelectItem value="educational">Educational</SelectItem>
              <SelectItem value="discharge">Discharge</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="achieved">Achieved</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Treatment Goal</DialogTitle>
              <DialogDescription>Create a new measurable treatment goal</DialogDescription>
            </DialogHeader>
            <AddGoalForm onSubmit={handleAddGoal} onCancel={() => setShowAddDialog(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals List */}
      <div className="space-y-3">
        {filteredGoals.map((goal) => {
          const isExpanded = expandedGoals.includes(goal.id);
          const daysRemaining = differenceInDays(goal.targetDate, new Date());
          const isOverdue = daysRemaining < 0 && goal.status !== "achieved";
          const CategoryIcon = categoryConfig[goal.category].icon;

          return (
            <Card key={goal.id} className={cn(
              "transition-all",
              goal.status === "achieved" && "bg-success/5 border-success/30",
              isOverdue && "border-destructive/50"
            )}>
              <Collapsible open={isExpanded} onOpenChange={() => toggleExpand(goal.id)}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        categoryConfig[goal.category].color
                      )}>
                        <CategoryIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{goal.title}</h4>
                          <Badge 
                            variant={statusConfig[goal.status].variant}
                            className={cn(
                              goal.status === "achieved" && "bg-success/10 text-success border-success"
                            )}
                          >
                            {statusConfig[goal.status].label}
                          </Badge>
                          {goal.priority === "high" && (
                            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/50">
                              High Priority
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                      </div>
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </CollapsibleTrigger>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 ml-13">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <div className="flex items-center gap-4">
                        {goal.targetValue && (
                          <span className="text-xs">
                            Current: <span className="font-medium">{goal.currentValue}</span> / Target: <span className="font-medium">{goal.targetValue} {goal.unit}</span>
                          </span>
                        )}
                        <span className={cn(
                          "font-medium",
                          goal.progress >= 100 ? "text-success" : goal.progress >= 50 ? "text-primary" : "text-muted-foreground"
                        )}>
                          {goal.progress}%
                        </span>
                      </div>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Target: {format(goal.targetDate, "dd MMM yyyy")}
                      </span>
                      <span className={cn(isOverdue && "text-destructive font-medium")}>
                        {isOverdue 
                          ? `${Math.abs(daysRemaining)} days overdue`
                          : `${daysRemaining} days remaining`
                        }
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {/* Milestones */}
                    {goal.milestones.length > 0 && (
                      <div className="mt-4 ml-13">
                        <h5 className="text-sm font-medium mb-3">Milestones</h5>
                        <div className="space-y-2">
                          {goal.milestones.map((milestone, index) => (
                            <div 
                              key={milestone.id}
                              className={cn(
                                "flex items-center gap-3 p-2 rounded-lg",
                                milestone.completed ? "bg-success/10" : "bg-muted/50"
                              )}
                            >
                              <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-xs border-2",
                                milestone.completed 
                                  ? "bg-success border-success text-success-foreground" 
                                  : "border-muted-foreground text-muted-foreground"
                              )}>
                                {milestone.completed ? <Check className="w-3 h-3" /> : index + 1}
                              </div>
                              <div className="flex-1">
                                <p className={cn(
                                  "text-sm",
                                  milestone.completed && "line-through text-muted-foreground"
                                )}>
                                  {milestone.description}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {milestone.completed 
                                    ? `Completed ${format(milestone.completedDate!, "dd MMM")}`
                                    : `Due ${format(milestone.targetDate, "dd MMM")}`
                                  }
                                </p>
                              </div>
                              {!milestone.completed && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleMilestoneComplete(goal.id, milestone.id)}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {goal.notes.length > 0 && (
                      <div className="mt-4 ml-13">
                        <h5 className="text-sm font-medium mb-2">Notes</h5>
                        <div className="space-y-2">
                          {goal.notes.map(note => (
                            <div key={note.id} className="text-sm p-2 bg-muted/30 rounded">
                              <p>{note.text}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {note.author} • {format(note.timestamp, "dd MMM HH:mm")}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 ml-13 flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Plus className="w-3 h-3 mr-1" />
                        Add Note
                      </Button>
                      {goal.status !== "achieved" && (
                        <Button variant="outline" size="sm" className="text-success border-success/50 hover:bg-success/10">
                          <Check className="w-3 h-3 mr-1" />
                          Mark Achieved
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

interface AddGoalFormProps {
  onSubmit: (goal: Partial<TreatmentGoal>) => void;
  onCancel: () => void;
}

function AddGoalForm({ onSubmit, onCancel }: AddGoalFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "clinical" as TreatmentGoal["category"],
    priority: "medium" as TreatmentGoal["priority"],
    targetDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    targetValue: "",
    unit: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      targetDate: new Date(formData.targetDate),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Goal Title *</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="e.g., Blood Pressure Control"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Description *</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe the goal in detail..."
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select 
            value={formData.category} 
            onValueChange={(v) => setFormData(prev => ({ ...prev, category: v as TreatmentGoal["category"] }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="clinical">Clinical</SelectItem>
              <SelectItem value="functional">Functional</SelectItem>
              <SelectItem value="behavioral">Behavioral</SelectItem>
              <SelectItem value="educational">Educational</SelectItem>
              <SelectItem value="discharge">Discharge</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select 
            value={formData.priority} 
            onValueChange={(v) => setFormData(prev => ({ ...prev, priority: v as TreatmentGoal["priority"] }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Target Date</Label>
        <Input
          type="date"
          value={formData.targetDate}
          onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Target Value (optional)</Label>
          <Input
            value={formData.targetValue}
            onChange={(e) => setFormData(prev => ({ ...prev, targetValue: e.target.value }))}
            placeholder="e.g., 140/90"
          />
        </div>
        <div className="space-y-2">
          <Label>Unit (optional)</Label>
          <Input
            value={formData.unit}
            onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
            placeholder="e.g., mmHg"
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Add Goal</Button>
      </DialogFooter>
    </form>
  );
}
