import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  Search,
  FileText,
  Stethoscope,
  Edit,
  Trash2,
  Link,
  TrendingUp,
  Clock,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  History,
  Target,
} from "lucide-react";
import { format } from "date-fns";
import { MOCK_PROBLEMS, MOCK_DIAGNOSES } from "@/data/mockClinicalData";
import type { ProblemStatus, DiagnosisCertainty } from "@/types/clinical";

const statusColors: Record<ProblemStatus, { badge: string; label: string }> = {
  active: { badge: "default", label: "Active" },
  resolved: { badge: "secondary", label: "Resolved" },
  recurrence: { badge: "destructive", label: "Recurrence" },
  remission: { badge: "outline", label: "In Remission" },
};

const certaintyColors: Record<DiagnosisCertainty, { badge: string; label: string }> = {
  suspected: { badge: "outline", label: "Suspected" },
  provisional: { badge: "secondary", label: "Provisional" },
  confirmed: { badge: "default", label: "Confirmed" },
};

// Mock differential diagnoses
const MOCK_DIFFERENTIALS = [
  { id: "df1", name: "Acute Pancreatitis", likelihood: "moderate", ruled_out: false, reason: "Lipase normal" },
  { id: "df2", name: "Biliary Colic", likelihood: "high", ruled_out: true, reason: "Wall thickening confirms cholecystitis" },
  { id: "df3", name: "Peptic Ulcer Disease", likelihood: "low", ruled_out: false, reason: "No history of NSAIDs or H. pylori" },
  { id: "df4", name: "Acute Appendicitis", likelihood: "low", ruled_out: true, reason: "Previous appendicectomy" },
];

function ProblemListPanel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [problems, setProblems] = useState(MOCK_PROBLEMS);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<string | null>(null);
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  
  // New problem form state
  const [newProblem, setNewProblem] = useState({
    name: "",
    snomedCode: "",
    onsetDate: "",
    status: "active" as ProblemStatus,
    comments: "",
  });

  const filteredProblems = problems.filter(problem => {
    const matchesSearch = problem.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || problem.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddProblem = () => {
    if (newProblem.name) {
      const problem = {
        id: `p${Date.now()}`,
        name: newProblem.name,
        snomedCode: newProblem.snomedCode || undefined,
        onsetDate: newProblem.onsetDate ? new Date(newProblem.onsetDate) : undefined,
        status: newProblem.status,
        comments: newProblem.comments || undefined,
        recordedBy: "Current User",
        recordedAt: new Date(),
      };
      setProblems([...problems, problem]);
      setNewProblem({ name: "", snomedCode: "", onsetDate: "", status: "active", comments: "" });
      setIsAddOpen(false);
    }
  };

  const handleUpdateStatus = (id: string, status: ProblemStatus) => {
    setProblems(problems.map(p => 
      p.id === id ? { ...p, status, resolvedDate: status === 'resolved' ? new Date() : undefined } : p
    ));
  };

  const handleDeleteProblem = (id: string) => {
    setProblems(problems.filter(p => p.id !== id));
  };

  const toggleProblemSelection = (id: string) => {
    setSelectedProblems(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search problems..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="recurrence">Recurrence</SelectItem>
            <SelectItem value="remission">In Remission</SelectItem>
          </SelectContent>
        </Select>
        
        {selectedProblems.length > 0 && (
          <Button variant="outline" size="sm">
            <Link className="w-4 h-4 mr-2" />
            Link to Diagnosis ({selectedProblems.length})
          </Button>
        )}
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Problem
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Problem</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Problem Name *</Label>
                <Input 
                  placeholder="Search or enter problem..."
                  value={newProblem.name}
                  onChange={(e) => setNewProblem({ ...newProblem, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>SNOMED-CT Code (optional)</Label>
                <Input 
                  placeholder="e.g., 44054006"
                  value={newProblem.snomedCode}
                  onChange={(e) => setNewProblem({ ...newProblem, snomedCode: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Onset Date</Label>
                  <Input 
                    type="date"
                    value={newProblem.onsetDate}
                    onChange={(e) => setNewProblem({ ...newProblem, onsetDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={newProblem.status}
                    onValueChange={(v) => setNewProblem({ ...newProblem, status: v as ProblemStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="recurrence">Recurrence</SelectItem>
                      <SelectItem value="remission">In Remission</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Comments</Label>
                <Textarea 
                  placeholder="Additional notes..."
                  value={newProblem.comments}
                  onChange={(e) => setNewProblem({ ...newProblem, comments: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAddProblem}>Add Problem</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Problem Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-destructive">
              {problems.filter(p => p.status === 'active').length}
            </div>
            <div className="text-xs text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        <Card className="bg-warning/5 border-warning/20">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-warning">
              {problems.filter(p => p.status === 'recurrence').length}
            </div>
            <div className="text-xs text-muted-foreground">Recurrence</div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-primary">
              {problems.filter(p => p.status === 'remission').length}
            </div>
            <div className="text-xs text-muted-foreground">In Remission</div>
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-success">
              {problems.filter(p => p.status === 'resolved').length}
            </div>
            <div className="text-xs text-muted-foreground">Resolved</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Problem</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Onset</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProblems.map(problem => (
                <TableRow key={problem.id} className="group">
                  <TableCell>
                    <Checkbox 
                      checked={selectedProblems.includes(problem.id)}
                      onCheckedChange={() => toggleProblemSelection(problem.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {problem.status === 'active' ? (
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      ) : problem.status === 'recurrence' ? (
                        <TrendingUp className="w-4 h-4 text-warning" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      )}
                      {problem.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {problem.snomedCode || "—"}
                    </code>
                  </TableCell>
                  <TableCell className="text-sm">
                    {problem.onsetDate ? format(problem.onsetDate, "dd MMM yyyy") : "—"}
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={problem.status}
                      onValueChange={(v) => handleUpdateStatus(problem.id, v as ProblemStatus)}
                    >
                      <SelectTrigger className="w-28 h-7">
                        <Badge variant={statusColors[problem.status].badge as "default" | "secondary" | "destructive" | "outline"}>
                          {statusColors[problem.status].label}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="recurrence">Recurrence</SelectItem>
                        <SelectItem value="remission">In Remission</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {problem.comments || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDeleteProblem(problem.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
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

function DifferentialDiagnosisPanel() {
  const [differentials, setDifferentials] = useState(MOCK_DIFFERENTIALS);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newDifferential, setNewDifferential] = useState({ name: "", likelihood: "moderate", reason: "" });

  const getLikelihoodColor = (likelihood: string) => {
    switch (likelihood) {
      case "high": return "text-destructive";
      case "moderate": return "text-warning";
      case "low": return "text-success";
      default: return "text-muted-foreground";
    }
  };

  const getLikelihoodIcon = (likelihood: string) => {
    switch (likelihood) {
      case "high": return <AlertTriangle className="w-4 h-4" />;
      case "moderate": return <HelpCircle className="w-4 h-4" />;
      case "low": return <CheckCircle2 className="w-4 h-4" />;
      default: return null;
    }
  };

  const handleRuleOut = (id: string) => {
    setDifferentials(prev => 
      prev.map(d => d.id === id ? { ...d, ruled_out: !d.ruled_out } : d)
    );
  };

  const handlePromoteToDiagnosis = (id: string) => {
    // Promote differential to working diagnosis
    const diff = differentials.find(d => d.id === id);
    if (diff) {
      setDifferentials(prev => prev.filter(d => d.id !== id));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">DIFFERENTIAL DIAGNOSES</h3>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Differential
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle>Add Differential Diagnosis</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Diagnosis</Label>
                <Input 
                  placeholder="Enter differential diagnosis..."
                  value={newDifferential.name}
                  onChange={(e) => setNewDifferential({ ...newDifferential, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Likelihood</Label>
                <Select 
                  value={newDifferential.likelihood}
                  onValueChange={(v) => setNewDifferential({ ...newDifferential, likelihood: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reasoning / Evidence</Label>
                <Textarea 
                  placeholder="Clinical reasoning..."
                  value={newDifferential.reason}
                  onChange={(e) => setNewDifferential({ ...newDifferential, reason: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={() => {
                if (newDifferential.name) {
                  setDifferentials([...differentials, { 
                    id: `df${Date.now()}`, 
                    ...newDifferential, 
                    ruled_out: false 
                  }]);
                  setNewDifferential({ name: "", likelihood: "moderate", reason: "" });
                  setIsAddOpen(false);
                }
              }}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {differentials.map(diff => (
          <Card key={diff.id} className={diff.ruled_out ? "opacity-60 border-dashed" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${
                    diff.ruled_out ? "bg-muted" : 
                    diff.likelihood === "high" ? "bg-destructive/10" :
                    diff.likelihood === "moderate" ? "bg-warning/10" : "bg-success/10"
                  }`}>
                    {diff.ruled_out ? (
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <span className={getLikelihoodColor(diff.likelihood)}>
                        {getLikelihoodIcon(diff.likelihood)}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${diff.ruled_out ? "line-through" : ""}`}>
                        {diff.name}
                      </span>
                      {diff.ruled_out ? (
                        <Badge variant="outline" className="text-muted-foreground">Ruled Out</Badge>
                      ) : (
                        <Badge variant="outline" className={getLikelihoodColor(diff.likelihood)}>
                          {diff.likelihood.charAt(0).toUpperCase() + diff.likelihood.slice(1)} likelihood
                        </Badge>
                      )}
                    </div>
                    {diff.reason && (
                      <p className="text-sm text-muted-foreground mt-1">{diff.reason}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!diff.ruled_out && (
                    <Button variant="outline" size="sm" onClick={() => handlePromoteToDiagnosis(diff.id)}>
                      <ArrowRight className="w-3 h-3 mr-1" />
                      Promote
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleRuleOut(diff.id)}
                  >
                    {diff.ruled_out ? "Restore" : "Rule Out"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EncounterDiagnosesPanel() {
  const [diagnoses, setDiagnoses] = useState(MOCK_DIAGNOSES);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newDiagnosis, setNewDiagnosis] = useState({
    name: "",
    icdCode: "",
    isPrimary: false,
    certainty: "provisional" as DiagnosisCertainty,
    onsetType: "acute" as "acute" | "chronic",
    notes: "",
  });

  const handleAddDiagnosis = () => {
    if (newDiagnosis.name) {
      const diagnosis = {
        id: `d${Date.now()}`,
        ...newDiagnosis,
        diagnosedBy: "Current User",
        diagnosedAt: new Date(),
      };
      // If primary, demote other primaries
      if (diagnosis.isPrimary) {
        setDiagnoses(prev => prev.map(d => ({ ...d, isPrimary: false })));
      }
      setDiagnoses(prev => [...prev, diagnosis]);
      setNewDiagnosis({ name: "", icdCode: "", isPrimary: false, certainty: "provisional", onsetType: "acute", notes: "" });
      setIsAddOpen(false);
    }
  };

  const handleUpdateCertainty = (id: string, certainty: DiagnosisCertainty) => {
    setDiagnoses(prev => prev.map(d => d.id === id ? { ...d, certainty } : d));
  };

  const handleSetPrimary = (id: string) => {
    setDiagnoses(prev => prev.map(d => ({ ...d, isPrimary: d.id === id })));
  };

  const handleRemoveDiagnosis = (id: string) => {
    setDiagnoses(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">CURRENT ENCOUNTER DIAGNOSES</h3>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Diagnosis
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle>Add Diagnosis</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Diagnosis *</Label>
                <Input 
                  placeholder="Search ICD-11..."
                  value={newDiagnosis.name}
                  onChange={(e) => setNewDiagnosis({ ...newDiagnosis, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>ICD-11 Code</Label>
                <Input 
                  placeholder="e.g., K81.0"
                  value={newDiagnosis.icdCode}
                  onChange={(e) => setNewDiagnosis({ ...newDiagnosis, icdCode: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="isPrimary"
                  checked={newDiagnosis.isPrimary}
                  onCheckedChange={(checked) => setNewDiagnosis({ ...newDiagnosis, isPrimary: !!checked })}
                />
                <Label htmlFor="isPrimary" className="cursor-pointer">Set as primary diagnosis</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Onset Type</Label>
                  <Select 
                    value={newDiagnosis.onsetType}
                    onValueChange={(v) => setNewDiagnosis({ ...newDiagnosis, onsetType: v as "acute" | "chronic" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="acute">Acute</SelectItem>
                      <SelectItem value="chronic">Chronic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Certainty</Label>
                  <Select 
                    value={newDiagnosis.certainty}
                    onValueChange={(v) => setNewDiagnosis({ ...newDiagnosis, certainty: v as DiagnosisCertainty })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="suspected">Suspected</SelectItem>
                      <SelectItem value="provisional">Provisional</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea 
                  placeholder="Additional notes..."
                  value={newDiagnosis.notes}
                  onChange={(e) => setNewDiagnosis({ ...newDiagnosis, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAddDiagnosis}>Add Diagnosis</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {diagnoses.map((diagnosis, index) => (
          <Card key={diagnosis.id} className={diagnosis.isPrimary ? "border-primary border-2" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    diagnosis.isPrimary ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{diagnosis.name}</span>
                      {diagnosis.isPrimary && (
                        <Badge variant="default" className="text-xs">Primary</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {diagnosis.icdCode}
                      </code>
                      <Select 
                        value={diagnosis.certainty}
                        onValueChange={(v) => handleUpdateCertainty(diagnosis.id, v as DiagnosisCertainty)}
                      >
                        <SelectTrigger className="w-28 h-6 text-xs">
                          <Badge variant={certaintyColors[diagnosis.certainty].badge as "default" | "secondary" | "outline"}>
                            {certaintyColors[diagnosis.certainty].label}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          <SelectItem value="suspected">Suspected</SelectItem>
                          <SelectItem value="provisional">Provisional</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Badge variant="outline" className="text-xs capitalize">
                        {diagnosis.onsetType}
                      </Badge>
                    </div>
                    {diagnosis.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{diagnosis.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right text-xs text-muted-foreground mr-2">
                    <div>{diagnosis.diagnosedBy}</div>
                    <div>{format(diagnosis.diagnosedAt, "dd MMM HH:mm")}</div>
                  </div>
                  {!diagnosis.isPrimary && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSetPrimary(diagnosis.id)}>
                      <Target className="w-3 h-3" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-destructive"
                    onClick={() => handleRemoveDiagnosis(diagnosis.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ProblemsSection() {
  return (
    <Tabs defaultValue="diagnoses" className="space-y-4">
      <TabsList className="flex-wrap">
        <TabsTrigger value="diagnoses" className="flex items-center gap-2">
          <Stethoscope className="w-4 h-4" />
          Encounter Diagnoses
        </TabsTrigger>
        <TabsTrigger value="differentials" className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4" />
          Differential Diagnosis
        </TabsTrigger>
        <TabsTrigger value="problems" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Problem List
        </TabsTrigger>
      </TabsList>

      <TabsContent value="diagnoses">
        <EncounterDiagnosesPanel />
      </TabsContent>

      <TabsContent value="differentials">
        <DifferentialDiagnosisPanel />
      </TabsContent>

      <TabsContent value="problems">
        <ProblemListPanel />
      </TabsContent>
    </Tabs>
  );
}
