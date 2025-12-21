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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  Search,
  FileText,
  Stethoscope,
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

function ProblemListPanel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredProblems = MOCK_PROBLEMS.filter(problem => {
    const matchesSearch = problem.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || problem.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Problem
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle>Add New Problem</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Problem Name</Label>
                <Input placeholder="Search or enter problem..." />
              </div>
              <div className="space-y-2">
                <Label>SNOMED-CT Code (optional)</Label>
                <Input placeholder="e.g., 44054006" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Onset Date</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select defaultValue="active">
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
                <Textarea placeholder="Additional notes..." />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>Add Problem</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Problem</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Onset</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProblems.map(problem => (
                <TableRow key={problem.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {problem.status === 'active' ? (
                        <AlertCircle className="w-4 h-4 text-warning" />
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
                    <Badge variant={statusColors[problem.status].badge as "default" | "secondary" | "destructive" | "outline"}>
                      {statusColors[problem.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {problem.comments || "—"}
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

function EncounterDiagnosesPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">CURRENT ENCOUNTER DIAGNOSES</h3>
        <Dialog>
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
                <Label>Diagnosis</Label>
                <Input placeholder="Search ICD-11..." />
              </div>
              <div className="space-y-2">
                <Label>ICD-11 Code</Label>
                <Input placeholder="e.g., K81.0" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select defaultValue="secondary">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Certainty</Label>
                  <Select defaultValue="provisional">
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
                <Textarea placeholder="Additional notes..." />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>Add Diagnosis</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {MOCK_DIAGNOSES.map((diagnosis, index) => (
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
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{diagnosis.name}</span>
                      {diagnosis.isPrimary && (
                        <Badge variant="default" className="text-xs">Primary</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {diagnosis.icdCode}
                      </code>
                      <Badge variant={certaintyColors[diagnosis.certainty].badge as "default" | "secondary" | "outline"}>
                        {certaintyColors[diagnosis.certainty].label}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {diagnosis.onsetType}
                      </Badge>
                    </div>
                    {diagnosis.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{diagnosis.notes}</p>
                    )}
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>{diagnosis.diagnosedBy}</div>
                  <div>{format(diagnosis.diagnosedAt, "dd MMM HH:mm")}</div>
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
      <TabsList>
        <TabsTrigger value="diagnoses" className="flex items-center gap-2">
          <Stethoscope className="w-4 h-4" />
          Encounter Diagnoses
        </TabsTrigger>
        <TabsTrigger value="problems" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Problem List (Longitudinal)
        </TabsTrigger>
      </TabsList>

      <TabsContent value="diagnoses">
        <EncounterDiagnosesPanel />
      </TabsContent>

      <TabsContent value="problems">
        <ProblemListPanel />
      </TabsContent>
    </Tabs>
  );
}
