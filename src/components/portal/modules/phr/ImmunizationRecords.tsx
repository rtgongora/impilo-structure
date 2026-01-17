import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Syringe,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  Building2,
  Download,
  Shield,
  Baby,
  Activity
} from "lucide-react";
import { format, differenceInDays, addYears } from "date-fns";

interface Immunization {
  id: string;
  vaccine: string;
  disease: string;
  dateAdministered: string;
  doseNumber?: number;
  totalDoses?: number;
  lotNumber?: string;
  manufacturer?: string;
  administeredBy?: string;
  facility?: string;
  nextDueDate?: string;
  status: "completed" | "due" | "overdue" | "scheduled";
  category: "routine" | "travel" | "occupational" | "special";
}

const MOCK_IMMUNIZATIONS: Immunization[] = [
  {
    id: "1",
    vaccine: "COVID-19 Booster (Pfizer-BioNTech)",
    disease: "COVID-19",
    dateAdministered: "2023-10-15",
    doseNumber: 4,
    totalDoses: 4,
    lotNumber: "PF2023-456",
    manufacturer: "Pfizer",
    administeredBy: "Nurse Thompson",
    facility: "City General Hospital",
    status: "completed",
    category: "routine"
  },
  {
    id: "2",
    vaccine: "Influenza (Quadrivalent)",
    disease: "Influenza",
    dateAdministered: "2023-09-20",
    lotNumber: "FLU2023-789",
    manufacturer: "Sanofi",
    administeredBy: "Nurse Wilson",
    facility: "Community Clinic",
    nextDueDate: "2024-09-01",
    status: "completed",
    category: "routine"
  },
  {
    id: "3",
    vaccine: "Tetanus, Diphtheria, Pertussis (Tdap)",
    disease: "Tetanus/Diphtheria/Pertussis",
    dateAdministered: "2020-05-10",
    lotNumber: "TDAP2020-123",
    manufacturer: "GSK",
    facility: "City General Hospital",
    nextDueDate: "2030-05-10",
    status: "completed",
    category: "routine"
  },
  {
    id: "4",
    vaccine: "Shingles (Shingrix)",
    disease: "Herpes Zoster",
    dateAdministered: "",
    doseNumber: 0,
    totalDoses: 2,
    nextDueDate: "2024-03-01",
    status: "due",
    category: "routine"
  },
  {
    id: "5",
    vaccine: "Pneumococcal (PPSV23)",
    disease: "Pneumococcal Disease",
    dateAdministered: "",
    nextDueDate: "2023-12-01",
    status: "overdue",
    category: "routine"
  },
  {
    id: "6",
    vaccine: "Hepatitis B",
    disease: "Hepatitis B",
    dateAdministered: "2015-06-15",
    doseNumber: 3,
    totalDoses: 3,
    facility: "Occupational Health",
    status: "completed",
    category: "occupational"
  }
];

export function ImmunizationRecords() {
  const [filter, setFilter] = useState<"all" | "completed" | "due">("all");

  const completedCount = MOCK_IMMUNIZATIONS.filter(i => i.status === "completed").length;
  const dueCount = MOCK_IMMUNIZATIONS.filter(i => i.status === "due" || i.status === "overdue").length;
  const overdueCount = MOCK_IMMUNIZATIONS.filter(i => i.status === "overdue").length;

  const filteredImmunizations = MOCK_IMMUNIZATIONS.filter(imm => {
    if (filter === "all") return true;
    if (filter === "completed") return imm.status === "completed";
    if (filter === "due") return imm.status === "due" || imm.status === "overdue";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedCount}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card className={dueCount > 0 ? "border-warning/50" : ""}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{dueCount}</p>
              <p className="text-xs text-muted-foreground">Due Soon</p>
            </div>
          </CardContent>
        </Card>
        <Card className={overdueCount > 0 ? "border-destructive/50" : ""}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{overdueCount}</p>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alert */}
      {overdueCount > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <p className="font-medium">Overdue Immunizations</p>
                <p className="text-sm text-muted-foreground">
                  You have {overdueCount} immunization(s) that are past due. Please schedule with your provider.
                </p>
              </div>
              <Button size="sm" variant="destructive">
                Schedule Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All Records
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("completed")}
        >
          Completed
        </Button>
        <Button
          variant={filter === "due" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("due")}
        >
          Due / Overdue
        </Button>
      </div>

      {/* Immunization List */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-3">
          {filteredImmunizations.map((immunization) => (
            <ImmunizationCard key={immunization.id} immunization={immunization} />
          ))}
        </div>
      </ScrollArea>

      {/* Download Certificate */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Immunization Certificate</p>
                <p className="text-sm text-muted-foreground">
                  Download your official vaccination record
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ImmunizationCard({ immunization }: { immunization: Immunization }) {
  const getStatusColor = () => {
    switch (immunization.status) {
      case "completed": return "bg-success/10 text-success";
      case "due": return "bg-warning/10 text-warning";
      case "overdue": return "bg-destructive/10 text-destructive";
      case "scheduled": return "bg-info/10 text-info";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusBadgeVariant = () => {
    switch (immunization.status) {
      case "completed": return "default" as const;
      case "due": return "secondary" as const;
      case "overdue": return "destructive" as const;
      default: return "outline" as const;
    }
  };

  return (
    <Card className={immunization.status === "overdue" ? "border-destructive/30" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg ${getStatusColor()}`}>
              <Syringe className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold">{immunization.vaccine}</p>
                <Badge variant={getStatusBadgeVariant()} className="text-xs">
                  {immunization.status}
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {immunization.category}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{immunization.disease}</p>
              
              {immunization.dateAdministered && (
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(immunization.dateAdministered), "MMM dd, yyyy")}
                  </span>
                  {immunization.facility && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {immunization.facility}
                    </span>
                  )}
                  {immunization.lotNumber && (
                    <span className="font-mono">Lot: {immunization.lotNumber}</span>
                  )}
                </div>
              )}

              {immunization.doseNumber && immunization.totalDoses && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <span>Dose {immunization.doseNumber} of {immunization.totalDoses}</span>
                  </div>
                  <Progress 
                    value={(immunization.doseNumber / immunization.totalDoses) * 100} 
                    className="h-1.5 w-32"
                  />
                </div>
              )}
            </div>
          </div>
          
          {immunization.nextDueDate && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Next Due</p>
              <p className={`text-sm font-medium ${
                immunization.status === "overdue" ? "text-destructive" : ""
              }`}>
                {format(new Date(immunization.nextDueDate), "MMM yyyy")}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
