import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Stethoscope, AlertCircle, CheckCircle } from "lucide-react";

const MOCK_PROBLEMS = [
  {
    id: 1,
    name: "Type 2 Diabetes Mellitus",
    status: "active",
    onset: "2019-05-15",
    severity: "moderate",
  },
  {
    id: 2,
    name: "Hypertension",
    status: "active",
    onset: "2020-02-20",
    severity: "mild",
  },
  {
    id: 3,
    name: "Urinary Tract Infection",
    status: "active",
    onset: "2024-12-18",
    severity: "moderate",
  },
];

const MOCK_DIAGNOSES = [
  {
    id: 1,
    code: "E11.9",
    description: "Type 2 diabetes mellitus without complications",
    type: "primary",
  },
  {
    id: 2,
    code: "I10",
    description: "Essential (primary) hypertension",
    type: "secondary",
  },
  {
    id: 3,
    code: "N39.0",
    description: "Urinary tract infection, site not specified",
    type: "admission",
  },
];

export function ProblemsSection() {
  return (
    <div className="space-y-6">
      {/* Active Problems */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning" />
            Active Problems
          </CardTitle>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Problem
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_PROBLEMS.map((problem) => (
              <div
                key={problem.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-warning" />
                    <div>
                      <h4 className="font-medium">{problem.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Onset: {problem.onset} • Severity: {problem.severity}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {problem.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Diagnoses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-primary" />
            Diagnoses
          </CardTitle>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Diagnosis
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_DIAGNOSES.map((diagnosis) => (
              <div
                key={diagnosis.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-primary">{diagnosis.code}</span>
                      <h4 className="font-medium">{diagnosis.description}</h4>
                    </div>
                  </div>
                  <Badge
                    variant={diagnosis.type === "primary" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {diagnosis.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
