import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  Clock,
  FileText,
  Pill,
  TestTube,
  Stethoscope,
  Activity,
  AlertTriangle,
  User,
  Filter,
  ChevronDown,
  ChevronUp,
  HeartPulse,
  Syringe,
  BedDouble,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TimelineEventType =
  | "admission"
  | "discharge"
  | "note"
  | "vitals"
  | "medication"
  | "lab"
  | "imaging"
  | "procedure"
  | "alert"
  | "consult";

interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string;
  timestamp: Date;
  author?: string;
  details?: Record<string, string>;
  isImportant?: boolean;
}

const MOCK_EVENTS: TimelineEvent[] = [
  {
    id: "1",
    type: "admission",
    title: "Patient Admitted",
    description: "Emergency admission via A&E",
    timestamp: new Date(Date.now() - 172800000),
    author: "Dr. Sarah Moyo",
    details: { "Chief Complaint": "Chest pain, shortness of breath", "Triage": "P2 - Urgent" },
    isImportant: true,
  },
  {
    id: "2",
    type: "vitals",
    title: "Initial Vitals Recorded",
    description: "BP 160/95, HR 102, SpO2 92%, Temp 37.8°C",
    timestamp: new Date(Date.now() - 172500000),
    author: "Nurse Chipo",
    details: { "Blood Pressure": "160/95 mmHg", "Heart Rate": "102 bpm", "SpO2": "92%", "Temperature": "37.8°C" },
  },
  {
    id: "3",
    type: "lab",
    title: "Lab Orders Placed",
    description: "CBC, BMP, Troponin, D-dimer ordered",
    timestamp: new Date(Date.now() - 172000000),
    author: "Dr. Sarah Moyo",
  },
  {
    id: "4",
    type: "imaging",
    title: "Chest X-Ray Completed",
    description: "Findings: Bilateral infiltrates, cardiomegaly",
    timestamp: new Date(Date.now() - 168000000),
    author: "Dr. Radiologist",
    isImportant: true,
  },
  {
    id: "5",
    type: "alert",
    title: "Critical Lab Result",
    description: "Troponin elevated at 2.4 ng/mL (normal <0.04)",
    timestamp: new Date(Date.now() - 165000000),
    isImportant: true,
  },
  {
    id: "6",
    type: "consult",
    title: "Cardiology Consult Requested",
    description: "Urgent consult for elevated troponin and ECG changes",
    timestamp: new Date(Date.now() - 164000000),
    author: "Dr. Sarah Moyo",
  },
  {
    id: "7",
    type: "medication",
    title: "Medications Administered",
    description: "Aspirin 300mg, Clopidogrel 300mg, Enoxaparin 80mg",
    timestamp: new Date(Date.now() - 163000000),
    author: "Nurse Chipo",
  },
  {
    id: "8",
    type: "note",
    title: "Cardiology Consult Note",
    description: "NSTEMI diagnosed. Recommend medical management, cardiac catheterization tomorrow.",
    timestamp: new Date(Date.now() - 86400000),
    author: "Dr. James Ncube (Cardiology)",
    isImportant: true,
  },
  {
    id: "9",
    type: "procedure",
    title: "Cardiac Catheterization",
    description: "LAD 80% stenosis, RCA 50% stenosis. PCI to LAD with DES.",
    timestamp: new Date(Date.now() - 43200000),
    author: "Dr. Interventional Cardiologist",
    isImportant: true,
  },
  {
    id: "10",
    type: "vitals",
    title: "Post-Procedure Vitals",
    description: "BP 128/78, HR 76, SpO2 98%, Stable",
    timestamp: new Date(Date.now() - 36000000),
    author: "Nurse Farai",
  },
  {
    id: "11",
    type: "medication",
    title: "Discharge Medications Prepared",
    description: "Aspirin, Clopidogrel, Atorvastatin, Metoprolol, Lisinopril",
    timestamp: new Date(Date.now() - 7200000),
    author: "Pharmacist",
  },
  {
    id: "12",
    type: "note",
    title: "Discharge Summary",
    description: "Patient stable for discharge. Follow-up in cardiology clinic in 2 weeks.",
    timestamp: new Date(Date.now() - 3600000),
    author: "Dr. Sarah Moyo",
    isImportant: true,
  },
];

const eventTypeConfig: Record<TimelineEventType, { icon: React.ElementType; color: string; label: string }> = {
  admission: { icon: BedDouble, color: "bg-blue-500", label: "Admission" },
  discharge: { icon: BedDouble, color: "bg-emerald-500", label: "Discharge" },
  note: { icon: FileText, color: "bg-slate-500", label: "Note" },
  vitals: { icon: HeartPulse, color: "bg-pink-500", label: "Vitals" },
  medication: { icon: Pill, color: "bg-purple-500", label: "Medication" },
  lab: { icon: TestTube, color: "bg-indigo-500", label: "Lab" },
  imaging: { icon: Stethoscope, color: "bg-amber-500", label: "Imaging" },
  procedure: { icon: Syringe, color: "bg-red-500", label: "Procedure" },
  alert: { icon: AlertTriangle, color: "bg-destructive", label: "Alert" },
  consult: { icon: User, color: "bg-cyan-500", label: "Consult" },
};

export function PatientTimeline() {
  const [expandedEvents, setExpandedEvents] = useState<string[]>([]);
  const [visibleTypes, setVisibleTypes] = useState<TimelineEventType[]>(
    Object.keys(eventTypeConfig) as TimelineEventType[]
  );

  const toggleExpand = (id: string) => {
    setExpandedEvents((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const toggleType = (type: TimelineEventType) => {
    setVisibleTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const filteredEvents = MOCK_EVENTS.filter((event) => visibleTypes.includes(event.type));

  // Group events by date
  const groupedEvents = filteredEvents.reduce((acc, event) => {
    const dateKey = event.timestamp.toLocaleDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Patient Timeline
          </h2>
          <p className="text-sm text-muted-foreground">
            Chronological view of all clinical events
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter ({visibleTypes.length})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {Object.entries(eventTypeConfig).map(([type, config]) => (
              <DropdownMenuCheckboxItem
                key={type}
                checked={visibleTypes.includes(type as TimelineEventType)}
                onCheckedChange={() => toggleType(type as TimelineEventType)}
              >
                <span className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${config.color}`} />
                  {config.label}
                </span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-6">
          {Object.entries(groupedEvents).map(([date, events]) => (
            <div key={date}>
              <div className="sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {date === new Date().toLocaleDateString() ? "Today" : date}
                </Badge>
              </div>

              <div className="ml-4 border-l-2 border-muted pl-6 space-y-4">
                {events.map((event) => {
                  const config = eventTypeConfig[event.type];
                  const Icon = config.icon;
                  const isExpanded = expandedEvents.includes(event.id);

                  return (
                    <div key={event.id} className="relative">
                      {/* Timeline dot */}
                      <div
                        className={`absolute -left-[31px] h-4 w-4 rounded-full ${config.color} flex items-center justify-center ring-4 ring-background`}
                      >
                        <Icon className="h-2.5 w-2.5 text-white" />
                      </div>

                      <Card
                        className={`transition-all hover:shadow-md ${
                          event.isImportant ? "ring-1 ring-primary/50" : ""
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm">{event.title}</h4>
                                {event.isImportant && (
                                  <Badge variant="secondary" className="text-[10px] px-1">
                                    Important
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {event.description}
                              </p>

                              {event.details && isExpanded && (
                                <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    {Object.entries(event.details).map(([key, value]) => (
                                      <div key={key}>
                                        <span className="text-muted-foreground">{key}:</span>
                                        <span className="ml-1 font-medium">{value}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(event.timestamp)}
                                </span>
                                <span>{formatRelativeTime(event.timestamp)}</span>
                                {event.author && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {event.author}
                                  </span>
                                )}
                              </div>
                            </div>

                            {event.details && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpand(event.id)}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
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
