import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Activity,
  Heart,
  Brain,
  Bone,
  Eye,
  Stethoscope,
  Calendar,
  User,
  Building2,
  Search,
  ChevronRight,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { format } from "date-fns";

interface Condition {
  id: string;
  name: string;
  icd10Code: string;
  category: "cardiovascular" | "endocrine" | "musculoskeletal" | "neurological" | "respiratory" | "other";
  status: "active" | "resolved" | "in-remission";
  severity: "mild" | "moderate" | "severe";
  diagnosedDate: string;
  diagnosedBy: string;
  facility: string;
  notes?: string;
  isPrincipal?: boolean;
  isChronic?: boolean;
  trend?: "improving" | "stable" | "worsening";
}

const MOCK_CONDITIONS: Condition[] = [
  {
    id: "1",
    name: "Type 2 Diabetes Mellitus",
    icd10Code: "E11.9",
    category: "endocrine",
    status: "active",
    severity: "moderate",
    diagnosedDate: "2020-03-15",
    diagnosedBy: "Dr. Smith",
    facility: "City General Hospital",
    isChronic: true,
    trend: "stable",
    notes: "Well controlled on current medication. HbA1c target <7%."
  },
  {
    id: "2",
    name: "Essential Hypertension",
    icd10Code: "I10",
    category: "cardiovascular",
    status: "active",
    severity: "mild",
    diagnosedDate: "2019-08-22",
    diagnosedBy: "Dr. Johnson",
    facility: "City General Hospital",
    isChronic: true,
    trend: "improving",
    notes: "Blood pressure well controlled on Lisinopril."
  },
  {
    id: "3",
    name: "Hyperlipidemia",
    icd10Code: "E78.5",
    category: "endocrine",
    status: "active",
    severity: "moderate",
    diagnosedDate: "2021-01-10",
    diagnosedBy: "Dr. Johnson",
    facility: "City General Hospital",
    isChronic: true,
    trend: "improving"
  },
  {
    id: "4",
    name: "Acute Bronchitis",
    icd10Code: "J20.9",
    category: "respiratory",
    status: "resolved",
    severity: "mild",
    diagnosedDate: "2023-11-05",
    diagnosedBy: "Dr. Wilson",
    facility: "Community Clinic"
  },
  {
    id: "5",
    name: "Seasonal Allergic Rhinitis",
    icd10Code: "J30.2",
    category: "respiratory",
    status: "in-remission",
    severity: "mild",
    diagnosedDate: "2018-04-20",
    diagnosedBy: "Dr. Chen",
    facility: "Allergy Clinic"
  }
];

const categoryIcons: Record<string, React.ElementType> = {
  cardiovascular: Heart,
  endocrine: Activity,
  musculoskeletal: Bone,
  neurological: Brain,
  respiratory: Stethoscope,
  other: Activity
};

export function ConditionsList() {
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConditions = MOCK_CONDITIONS.filter(condition => {
    const matchesFilter = filter === "all" || 
      (filter === "active" && condition.status === "active") ||
      (filter === "resolved" && (condition.status === "resolved" || condition.status === "in-remission"));
    const matchesSearch = condition.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      condition.icd10Code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const activeConditions = MOCK_CONDITIONS.filter(c => c.status === "active");
  const chronicConditions = MOCK_CONDITIONS.filter(c => c.isChronic);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeConditions.length}</p>
              <p className="text-xs text-muted-foreground">Active Conditions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{chronicConditions.length}</p>
              <p className="text-xs text-muted-foreground">Chronic Conditions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {MOCK_CONDITIONS.filter(c => c.status === "resolved").length}
              </p>
              <p className="text-xs text-muted-foreground">Resolved</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conditions..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Conditions List */}
      <ScrollArea className="h-[450px]">
        <div className="space-y-3">
          {filteredConditions.map((condition) => (
            <ConditionCard key={condition.id} condition={condition} />
          ))}
          {filteredConditions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No conditions found matching your criteria.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function ConditionCard({ condition }: { condition: Condition }) {
  const Icon = categoryIcons[condition.category] || Activity;

  const getTrendIcon = () => {
    if (!condition.trend) return null;
    switch (condition.trend) {
      case "improving": return <TrendingUp className="h-3 w-3 text-success" />;
      case "worsening": return <TrendingDown className="h-3 w-3 text-destructive" />;
      default: return <Activity className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <Card className={condition.status === "active" ? "border-l-4 border-l-primary" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg ${
              condition.status === "active" ? "bg-primary/10" : "bg-muted"
            }`}>
              <Icon className={`h-5 w-5 ${
                condition.status === "active" ? "text-primary" : "text-muted-foreground"
              }`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold">{condition.name}</p>
                <Badge variant="outline" className="text-xs font-mono">
                  {condition.icd10Code}
                </Badge>
                {condition.isChronic && (
                  <Badge variant="secondary" className="text-xs">
                    Chronic
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(condition.diagnosedDate), "MMM yyyy")}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {condition.diagnosedBy}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {condition.facility}
                </span>
              </div>
              {condition.notes && (
                <p className="text-sm text-muted-foreground mt-2 bg-muted/50 p-2 rounded">
                  {condition.notes}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={
              condition.status === "active" ? "default" :
              condition.status === "in-remission" ? "secondary" : "outline"
            }>
              {condition.status}
            </Badge>
            <Badge variant={
              condition.severity === "severe" ? "destructive" :
              condition.severity === "moderate" ? "secondary" : "outline"
            } className="text-xs">
              {condition.severity}
            </Badge>
            {condition.trend && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getTrendIcon()}
                <span className="capitalize">{condition.trend}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
