import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Heart, Pill, ListChecks, Calendar } from "lucide-react";

const MOCK_MEDICATIONS = [
  {
    id: 1,
    name: "Metformin 500mg",
    dose: "1 tablet",
    frequency: "Twice daily",
    route: "Oral",
    status: "active",
  },
  {
    id: 2,
    name: "Amlodipine 5mg",
    dose: "1 tablet",
    frequency: "Once daily",
    route: "Oral",
    status: "active",
  },
  {
    id: 3,
    name: "Ciprofloxacin 500mg",
    dose: "1 tablet",
    frequency: "Twice daily",
    route: "Oral",
    status: "active",
    duration: "7 days",
  },
  {
    id: 4,
    name: "Paracetamol 1g",
    dose: "1 tablet",
    frequency: "As needed",
    route: "Oral",
    status: "prn",
  },
];

const MOCK_CARE_PLANS = [
  {
    id: 1,
    name: "UTI Management Plan",
    status: "active",
    goals: ["Complete antibiotic course", "Increase fluid intake", "Monitor symptoms"],
  },
  {
    id: 2,
    name: "Diabetes Management",
    status: "active",
    goals: ["Blood glucose monitoring", "Diet management", "Medication adherence"],
  },
];

export function CareSection() {
  return (
    <div className="space-y-6">
      {/* Active Medications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Pill className="w-5 h-5 text-primary" />
            Active Medications
          </CardTitle>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Prescribe
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_MEDICATIONS.map((med) => (
              <div
                key={med.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{med.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {med.dose} • {med.frequency} • {med.route}
                      {med.duration && ` • ${med.duration}`}
                    </p>
                  </div>
                  <Badge
                    variant={med.status === "active" ? "default" : "secondary"}
                    className="uppercase text-xs"
                  >
                    {med.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Care Plans */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-primary" />
            Care Plans
          </CardTitle>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" />
            New Plan
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_CARE_PLANS.map((plan) => (
              <div
                key={plan.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{plan.name}</h4>
                  <Badge variant="default" className="capitalize">
                    {plan.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {plan.goals.map((goal, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {goal}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
