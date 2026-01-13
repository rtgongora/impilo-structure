import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  Calendar,
  FileText,
  Pill,
  TestTube2,
  Stethoscope,
  Activity,
  CreditCard,
  Download,
  Share2,
  Filter,
  Search,
  ChevronDown,
  Bed,
  Syringe,
  Image as ImageIcon,
  Heart,
  Clock
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface TimelineEvent {
  id: string;
  type: "encounter" | "admission" | "lab" | "imaging" | "medication" | "procedure" | "immunization" | "payment";
  title: string;
  subtitle?: string;
  date: string;
  facility: string;
  provider?: string;
  status: "completed" | "pending" | "cancelled";
  details?: Record<string, string>;
  hasDocument?: boolean;
}

const MOCK_TIMELINE: TimelineEvent[] = [
  {
    id: "1",
    type: "encounter",
    title: "Cardiology Consultation",
    subtitle: "Follow-up visit",
    date: "2024-01-18",
    facility: "City General Hospital",
    provider: "Dr. Johnson",
    status: "completed",
    details: {
      "Chief Complaint": "Chest discomfort on exertion",
      "Assessment": "Stable angina, well controlled",
      "Plan": "Continue current medications, follow up in 3 months"
    },
    hasDocument: true
  },
  {
    id: "2",
    type: "lab",
    title: "Lipid Panel",
    subtitle: "Blood test",
    date: "2024-01-15",
    facility: "PathLab Services",
    status: "completed",
    details: {
      "Total Cholesterol": "185 mg/dL (Normal)",
      "LDL": "110 mg/dL (Borderline)",
      "HDL": "55 mg/dL (Normal)",
      "Triglycerides": "120 mg/dL (Normal)"
    },
    hasDocument: true
  },
  {
    id: "3",
    type: "medication",
    title: "Atorvastatin 20mg",
    subtitle: "New prescription",
    date: "2024-01-15",
    facility: "City General Hospital",
    provider: "Dr. Johnson",
    status: "completed",
    details: {
      "Dosage": "20mg once daily at bedtime",
      "Duration": "90 days",
      "Refills": "3 refills remaining"
    }
  },
  {
    id: "4",
    type: "imaging",
    title: "Chest X-Ray",
    subtitle: "Diagnostic imaging",
    date: "2024-01-10",
    facility: "City General Hospital",
    status: "completed",
    details: {
      "Findings": "No acute cardiopulmonary disease",
      "Impression": "Normal chest radiograph"
    },
    hasDocument: true
  },
  {
    id: "5",
    type: "admission",
    title: "Inpatient Admission",
    subtitle: "Observation for chest pain",
    date: "2024-01-08",
    facility: "City General Hospital",
    provider: "Dr. Smith",
    status: "completed",
    details: {
      "Length of Stay": "2 days",
      "Ward": "Cardiology Unit",
      "Discharge": "Stable, follow up in OPD"
    },
    hasDocument: true
  },
  {
    id: "6",
    type: "immunization",
    title: "Influenza Vaccine",
    subtitle: "Seasonal flu shot",
    date: "2023-10-15",
    facility: "Community Clinic",
    status: "completed",
    details: {
      "Vaccine": "Quadrivalent Influenza",
      "Lot Number": "FLU2023-456",
      "Site": "Left deltoid"
    }
  },
  {
    id: "7",
    type: "payment",
    title: "Consultation Payment",
    subtitle: "$50.00",
    date: "2024-01-18",
    facility: "City General Hospital",
    status: "completed",
    details: {
      "Method": "Health Wallet",
      "Receipt": "RCT-2024-0123"
    }
  }
];

export function PortalHealthTimeline() {
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEvents, setExpandedEvents] = useState<string[]>([]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case "encounter": return Stethoscope;
      case "admission": return Bed;
      case "lab": return TestTube2;
      case "imaging": return ImageIcon;
      case "medication": return Pill;
      case "procedure": return Activity;
      case "immunization": return Syringe;
      case "payment": return CreditCard;
      default: return FileText;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "encounter": return "bg-primary/10 text-primary";
      case "admission": return "bg-warning/10 text-warning";
      case "lab": return "bg-info/10 text-info";
      case "imaging": return "bg-secondary/10 text-secondary";
      case "medication": return "bg-success/10 text-success";
      case "procedure": return "bg-destructive/10 text-destructive";
      case "immunization": return "bg-purple-500/10 text-purple-500";
      case "payment": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedEvents(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const filteredEvents = MOCK_TIMELINE.filter(event => {
    const matchesFilter = filter === "all" || event.type === filter;
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.facility.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Group events by month
  const groupedEvents = filteredEvents.reduce((acc, event) => {
    const month = new Date(event.date).toLocaleDateString("en-US", { year: "numeric", month: "long" });
    if (!acc[month]) acc[month] = [];
    acc[month].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Health Timeline
          </h2>
          <p className="text-sm text-muted-foreground">
            Your complete health journey
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share Summary
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search timeline..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="encounter">Visits</SelectItem>
            <SelectItem value="admission">Admissions</SelectItem>
            <SelectItem value="lab">Lab Results</SelectItem>
            <SelectItem value="imaging">Imaging</SelectItem>
            <SelectItem value="medication">Medications</SelectItem>
            <SelectItem value="immunization">Immunizations</SelectItem>
            <SelectItem value="payment">Payments</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-6">
          {Object.entries(groupedEvents).map(([month, events]) => (
            <div key={month}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 sticky top-0 bg-background py-2">
                {month}
              </h3>
              <div className="space-y-3">
                {events.map(event => {
                  const Icon = getEventIcon(event.type);
                  const isExpanded = expandedEvents.includes(event.id);
                  
                  return (
                    <Collapsible 
                      key={event.id} 
                      open={isExpanded}
                      onOpenChange={() => toggleExpanded(event.id)}
                    >
                      <Card className="overflow-hidden">
                        <CollapsibleTrigger className="w-full">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className={`p-2 rounded-lg ${getEventColor(event.type)}`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="flex-1 text-left">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{event.title}</p>
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {event.type}
                                  </Badge>
                                </div>
                                {event.subtitle && (
                                  <p className="text-sm text-muted-foreground">{event.subtitle}</p>
                                )}
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  <span>{event.facility}</span>
                                  {event.provider && <span>• {event.provider}</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  {new Date(event.date).toLocaleDateString("en-US", { 
                                    month: "short", 
                                    day: "numeric" 
                                  })}
                                </span>
                                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                              </div>
                            </div>
                          </CardContent>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-4 pb-4 pt-0 border-t">
                            <div className="mt-4 space-y-2">
                              {event.details && Object.entries(event.details).map(([key, value]) => (
                                <div key={key} className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">{key}:</span>
                                  <span className="font-medium">{value}</span>
                                </div>
                              ))}
                            </div>
                            {event.hasDocument && (
                              <div className="mt-4 flex gap-2">
                                <Button size="sm" variant="outline">
                                  <FileText className="h-4 w-4 mr-2" />
                                  View Document
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Share2 className="h-4 w-4 mr-2" />
                                  Share
                                </Button>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
