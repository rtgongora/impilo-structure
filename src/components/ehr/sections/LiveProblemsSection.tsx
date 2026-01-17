/**
 * Live Problems Section
 * Displays patient problems from database with CRUD operations
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  Search,
  Edit,
  Trash2,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { usePatientProblems, type ProblemInput } from "@/hooks/usePatientProblems";

interface LiveProblemsSectionProps {
  patientId?: string;
  encounterId?: string;
}

type ProblemStatus = "active" | "resolved" | "recurrence" | "remission" | "inactive";

const statusColors: Record<ProblemStatus, { badge: string; label: string }> = {
  active: { badge: "default", label: "Active" },
  resolved: { badge: "secondary", label: "Resolved" },
  recurrence: { badge: "destructive", label: "Recurrence" },
  remission: { badge: "outline", label: "In Remission" },
  inactive: { badge: "secondary", label: "Inactive" },
};

export function LiveProblemsSection({ patientId, encounterId }: LiveProblemsSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newProblem, setNewProblem] = useState({
    problem_display: "",
    problem_code: "",
    problem_code_system: "SNOMED-CT",
    onset_date: "",
    clinical_status: "active" as ProblemStatus,
    severity: "moderate" as "mild" | "moderate" | "severe",
    notes: "",
  });

  const {
    problems,
    activeProblems,
    isLoading,
    addProblem,
    updateProblem,
    resolveProblem,
    deleteProblem,
  } = usePatientProblems(patientId);

  const filteredProblems = problems.filter((problem) => {
    const matchesSearch = problem.problem_display.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || problem.clinical_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddProblem = () => {
    if (!patientId || !newProblem.problem_display) return;

    const input: ProblemInput = {
      patient_id: patientId,
      encounter_id: encounterId,
      problem_display: newProblem.problem_display,
      problem_code: newProblem.problem_code || undefined,
      problem_code_system: newProblem.problem_code_system,
      onset_date: newProblem.onset_date || undefined,
      clinical_status: newProblem.clinical_status,
      severity: newProblem.severity,
      notes: newProblem.notes || undefined,
      is_principal_diagnosis: false,
      is_chronic: false,
      verification_status: "provisional",
    };

    addProblem.mutate(input, {
      onSuccess: () => {
        setNewProblem({
          problem_display: "",
          problem_code: "",
          problem_code_system: "SNOMED-CT",
          onset_date: "",
          clinical_status: "active",
          severity: "moderate",
          notes: "",
        });
        setIsAddOpen(false);
      },
    });
  };

  const handleUpdateStatus = (id: string, status: ProblemStatus) => {
    if (status === "resolved") {
      resolveProblem.mutate({ id });
    } else {
      updateProblem.mutate({ id, clinical_status: status });
    }
  };

  const handleDeleteProblem = (id: string) => {
    deleteProblem.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button disabled={!patientId}>
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
                  placeholder="Enter problem name..."
                  value={newProblem.problem_display}
                  onChange={(e) => setNewProblem({ ...newProblem, problem_display: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>SNOMED-CT Code (optional)</Label>
                <Input
                  placeholder="e.g., 44054006"
                  value={newProblem.problem_code}
                  onChange={(e) => setNewProblem({ ...newProblem, problem_code: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Onset Date</Label>
                  <Input
                    type="date"
                    value={newProblem.onset_date}
                    onChange={(e) => setNewProblem({ ...newProblem, onset_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select
                    value={newProblem.severity}
                    onValueChange={(v) => setNewProblem({ ...newProblem, severity: v as typeof newProblem.severity })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="mild">Mild</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={newProblem.notes}
                  onChange={(e) => setNewProblem({ ...newProblem, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAddProblem} disabled={!newProblem.problem_display || addProblem.isPending}>
                {addProblem.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Problem"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Problem Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-destructive">
              {problems.filter((p) => p.clinical_status === "active").length}
            </div>
            <div className="text-xs text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        <Card className="bg-warning/5 border-warning/20">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-warning">
              {problems.filter((p) => p.clinical_status === "recurrence").length}
            </div>
            <div className="text-xs text-muted-foreground">Recurrence</div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-primary">
              {problems.filter((p) => p.clinical_status === "remission").length}
            </div>
            <div className="text-xs text-muted-foreground">In Remission</div>
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-success">
              {problems.filter((p) => p.clinical_status === "resolved").length}
            </div>
            <div className="text-xs text-muted-foreground">Resolved</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Problem</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Onset</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProblems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {problems.length === 0 ? "No problems recorded" : "No matching problems"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProblems.map((problem) => (
                    <TableRow key={problem.id} className="group">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {problem.clinical_status === "active" ? (
                            <AlertCircle className="w-4 h-4 text-destructive" />
                          ) : problem.clinical_status === "recurrence" ? (
                            <TrendingUp className="w-4 h-4 text-warning" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          )}
                          {problem.problem_display}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {problem.problem_code || "—"}
                        </code>
                      </TableCell>
                      <TableCell className="text-sm">
                        {problem.onset_date
                          ? format(new Date(problem.onset_date), "dd MMM yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={problem.clinical_status}
                          onValueChange={(v) => handleUpdateStatus(problem.id, v as ProblemStatus)}
                        >
                          <SelectTrigger className="w-28 h-7">
                            <Badge variant={statusColors[problem.clinical_status as ProblemStatus]?.badge as any || "default"}>
                              {statusColors[problem.clinical_status as ProblemStatus]?.label || problem.clinical_status}
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
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {problem.severity || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
