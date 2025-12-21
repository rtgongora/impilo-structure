import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Syringe,
  Stethoscope,
  Activity,
  Pill,
  Droplets,
  Wind,
  Bandage,
  Brain,
  MessageSquare,
  Plus,
  Check,
  Clock,
  AlertCircle,
  ChevronRight,
  Edit,
  Trash2,
  User,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface NursingIntervention {
  id: string;
  category: "assessment" | "medication" | "nutrition" | "hygiene" | "mobility" | "respiratory" | "wound" | "psychosocial" | "education";
  title: string;
  description: string;
  frequency: string;
  responsibleRole: string;
  status: "active" | "on-hold" | "discontinued" | "completed";
  priority: "routine" | "urgent" | "stat";
  startDate: Date;
  endDate?: Date;
  lastPerformed?: Date;
  performedBy?: string;
  linkedGoalId?: string;
  orders?: string[];
  notes?: string;
}

const MOCK_INTERVENTIONS: NursingIntervention[] = [
  {
    id: "I001",
    category: "assessment",
    title: "Vital Signs Monitoring",
    description: "Monitor and document vital signs including BP, HR, RR, SpO2, Temperature",
    frequency: "Every 4 hours",
    responsibleRole: "Nursing Staff",
    status: "active",
    priority: "routine",
    startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    lastPerformed: new Date(Date.now() - 2 * 60 * 60 * 1000),
    performedBy: "RN Tendai Moyo",
    linkedGoalId: "G001",
  },
  {
    id: "I002",
    category: "medication",
    title: "Insulin Administration",
    description: "Administer sliding scale insulin per protocol based on blood glucose readings",
    frequency: "Before meals (TID)",
    responsibleRole: "Registered Nurse",
    status: "active",
    priority: "urgent",
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    lastPerformed: new Date(Date.now() - 4 * 60 * 60 * 1000),
    performedBy: "RN Tendai Moyo",
    linkedGoalId: "G003",
    orders: ["Sliding scale insulin per protocol", "Check BG before each dose"],
  },
  {
    id: "I003",
    category: "wound",
    title: "Surgical Site Dressing Change",
    description: "Clean and redress surgical wound using aseptic technique",
    frequency: "Daily",
    responsibleRole: "Registered Nurse",
    status: "active",
    priority: "routine",
    startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    lastPerformed: new Date(Date.now() - 20 * 60 * 60 * 1000),
    performedBy: "RN Sarah Ndlovu",
    notes: "Wound healing well, no signs of infection",
  },
  {
    id: "I004",
    category: "mobility",
    title: "Early Ambulation Program",
    description: "Assist patient with progressive ambulation as tolerated",
    frequency: "TID (after meals)",
    responsibleRole: "Nursing Staff / Physiotherapy",
    status: "active",
    priority: "routine",
    startDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    lastPerformed: new Date(Date.now() - 6 * 60 * 60 * 1000),
    linkedGoalId: "G002",
  },
  {
    id: "I005",
    category: "respiratory",
    title: "Incentive Spirometry",
    description: "Encourage use of incentive spirometer to prevent atelectasis",
    frequency: "Every 2 hours while awake",
    responsibleRole: "Nursing Staff",
    status: "active",
    priority: "routine",
    startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: "I006",
    category: "nutrition",
    title: "Dietary Intake Monitoring",
    description: "Monitor and document dietary intake, ensure adequate nutrition",
    frequency: "Each meal",
    responsibleRole: "Nursing Staff",
    status: "active",
    priority: "routine",
    startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: "I007",
    category: "education",
    title: "Diabetes Education",
    description: "Provide education on diabetes self-management, diet, and medication",
    frequency: "Daily during hospitalization",
    responsibleRole: "Diabetes Educator / RN",
    status: "active",
    priority: "routine",
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    linkedGoalId: "G003",
  },
];

const categoryConfig: Record<NursingIntervention["category"], { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  assessment: { label: "Assessment", icon: Stethoscope, color: "bg-blue-500" },
  medication: { label: "Medication", icon: Pill, color: "bg-purple-500" },
  nutrition: { label: "Nutrition", icon: Droplets, color: "bg-orange-500" },
  hygiene: { label: "Hygiene", icon: Heart, color: "bg-pink-500" },
  mobility: { label: "Mobility", icon: Activity, color: "bg-green-500" },
  respiratory: { label: "Respiratory", icon: Wind, color: "bg-cyan-500" },
  wound: { label: "Wound Care", icon: Bandage, color: "bg-red-500" },
  psychosocial: { label: "Psychosocial", icon: Brain, color: "bg-indigo-500" },
  education: { label: "Education", icon: MessageSquare, color: "bg-yellow-500" },
};

interface NursingInterventionsProps {
  interventions?: NursingIntervention[];
  onInterventionAdd?: (intervention: NursingIntervention) => void;
  onInterventionUpdate?: (intervention: NursingIntervention) => void;
}

export function NursingInterventions({ interventions: propInterventions }: NursingInterventionsProps) {
  const [interventions, setInterventions] = useState<NursingIntervention[]>(propInterventions || MOCK_INTERVENTIONS);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const handlePerformIntervention = (interventionId: string) => {
    setInterventions(prev => prev.map(i => 
      i.id === interventionId 
        ? { ...i, lastPerformed: new Date(), performedBy: "Current User" }
        : i
    ));
    toast.success("Intervention documented");
  };

  const handleAddIntervention = (newIntervention: Partial<NursingIntervention>) => {
    const intervention: NursingIntervention = {
      id: `I${Date.now()}`,
      category: newIntervention.category || "assessment",
      title: newIntervention.title || "",
      description: newIntervention.description || "",
      frequency: newIntervention.frequency || "",
      responsibleRole: newIntervention.responsibleRole || "Nursing Staff",
      status: "active",
      priority: newIntervention.priority || "routine",
      startDate: new Date(),
    };
    setInterventions(prev => [...prev, intervention]);
    setShowAddDialog(false);
    toast.success("Intervention added");
  };

  const filteredInterventions = categoryFilter === "all"
    ? interventions.filter(i => i.status === "active")
    : interventions.filter(i => i.status === "active" && i.category === categoryFilter);

  // Group by category for card view
  const groupedInterventions = filteredInterventions.reduce((acc, intervention) => {
    if (!acc[intervention.category]) {
      acc[intervention.category] = [];
    }
    acc[intervention.category].push(intervention);
    return acc;
  }, {} as Record<string, NursingIntervention[]>);

  const stats = {
    total: interventions.filter(i => i.status === "active").length,
    dueNow: interventions.filter(i => {
      if (!i.lastPerformed || i.status !== "active") return false;
      const hoursSinceLast = (Date.now() - i.lastPerformed.getTime()) / (1000 * 60 * 60);
      return hoursSinceLast >= 4; // Simplified logic
    }).length,
    categories: new Set(interventions.filter(i => i.status === "active").map(i => i.category)).size,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-primary/10 border-primary/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Active Interventions</div>
          </CardContent>
        </Card>
        <Card className={cn("border-warning/30", stats.dueNow > 0 ? "bg-warning/10" : "bg-muted/30")}>
          <CardContent className="p-4 text-center">
            <div className={cn("text-2xl font-bold", stats.dueNow > 0 && "text-warning")}>{stats.dueNow}</div>
            <div className="text-sm text-muted-foreground">Due Now</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.categories}</div>
            <div className="text-sm text-muted-foreground">Categories</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(categoryConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === "cards" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
            >
              Cards
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              Table
            </Button>
          </div>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Intervention
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Nursing Intervention</DialogTitle>
              <DialogDescription>Create a new nursing care intervention</DialogDescription>
            </DialogHeader>
            <AddInterventionForm onSubmit={handleAddIntervention} onCancel={() => setShowAddDialog(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Interventions Display */}
      {viewMode === "cards" ? (
        <div className="space-y-6">
          {Object.entries(groupedInterventions).map(([category, items]) => {
            const config = categoryConfig[category as NursingIntervention["category"]];
            const Icon = config.icon;
            
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.color)}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-semibold">{config.label}</h3>
                  <Badge variant="outline">{items.length}</Badge>
                </div>
                <div className="grid gap-3">
                  {items.map(intervention => (
                    <Card key={intervention.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{intervention.title}</h4>
                              {intervention.priority === "urgent" && (
                                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/50">
                                  Urgent
                                </Badge>
                              )}
                              {intervention.priority === "stat" && (
                                <Badge variant="destructive">STAT</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{intervention.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {intervention.frequency}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {intervention.responsibleRole}
                              </span>
                            </div>
                            {intervention.lastPerformed && (
                              <div className="mt-2 text-xs">
                                <span className="text-muted-foreground">Last performed: </span>
                                <span className="font-medium">
                                  {format(intervention.lastPerformed, "dd MMM HH:mm")}
                                </span>
                                {intervention.performedBy && (
                                  <span className="text-muted-foreground"> by {intervention.performedBy}</span>
                                )}
                              </div>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handlePerformIntervention(intervention.id)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Document
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Intervention</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Responsible</TableHead>
                <TableHead>Last Performed</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInterventions.map(intervention => {
                const config = categoryConfig[intervention.category];
                const Icon = config.icon;
                
                return (
                  <TableRow key={intervention.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-6 h-6 rounded flex items-center justify-center", config.color)}>
                          <Icon className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm">{config.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{intervention.title}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-xs">
                          {intervention.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{intervention.frequency}</TableCell>
                    <TableCell className="text-sm">{intervention.responsibleRole}</TableCell>
                    <TableCell>
                      {intervention.lastPerformed ? (
                        <div className="text-sm">
                          <div>{format(intervention.lastPerformed, "dd MMM HH:mm")}</div>
                          <div className="text-xs text-muted-foreground">{intervention.performedBy}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => handlePerformIntervention(intervention.id)}>
                        <Check className="w-3 h-3 mr-1" />
                        Document
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

interface AddInterventionFormProps {
  onSubmit: (intervention: Partial<NursingIntervention>) => void;
  onCancel: () => void;
}

function AddInterventionForm({ onSubmit, onCancel }: AddInterventionFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "assessment" as NursingIntervention["category"],
    frequency: "",
    responsibleRole: "Nursing Staff",
    priority: "routine" as NursingIntervention["priority"],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Intervention Title *</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="e.g., Vital Signs Monitoring"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Description *</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe the intervention in detail..."
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={formData.category}
            onValueChange={(v) => setFormData(prev => ({ ...prev, category: v as NursingIntervention["category"] }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(categoryConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select
            value={formData.priority}
            onValueChange={(v) => setFormData(prev => ({ ...prev, priority: v as NursingIntervention["priority"] }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="routine">Routine</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="stat">STAT</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Frequency *</Label>
          <Input
            value={formData.frequency}
            onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
            placeholder="e.g., Every 4 hours"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Responsible Role</Label>
          <Select
            value={formData.responsibleRole}
            onValueChange={(v) => setFormData(prev => ({ ...prev, responsibleRole: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Nursing Staff">Nursing Staff</SelectItem>
              <SelectItem value="Registered Nurse">Registered Nurse</SelectItem>
              <SelectItem value="Nursing Assistant">Nursing Assistant</SelectItem>
              <SelectItem value="Physiotherapy">Physiotherapy</SelectItem>
              <SelectItem value="Dietitian">Dietitian</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Add Intervention</Button>
      </DialogFooter>
    </form>
  );
}
