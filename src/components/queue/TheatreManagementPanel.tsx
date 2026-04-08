import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Scissors, Clock, User, AlertTriangle, CheckCircle2,
  PlayCircle, PauseCircle, StopCircle, ChevronRight,
  Activity, Search, Timer, Bed, ShieldCheck, Stethoscope,
  ClipboardList, CalendarDays, XCircle, RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock theatre/OR data
const MOCK_THEATRES = [
  {
    id: "or-1", name: "Theatre 1 (Main)", status: "in_use" as const,
    currentCase: { patient: "T. Moyo", procedure: "Appendectomy", surgeon: "Dr. Ndlovu", anaesthetist: "Dr. Phiri", startTime: new Date(Date.now() - 45 * 60000), estimatedDuration: 90, phase: "operation" as const },
  },
  {
    id: "or-2", name: "Theatre 2", status: "in_use" as const,
    currentCase: { patient: "S. Banda", procedure: "C-Section", surgeon: "Dr. Mukwena", anaesthetist: "Dr. Chuma", startTime: new Date(Date.now() - 30 * 60000), estimatedDuration: 60, phase: "operation" as const },
  },
  {
    id: "or-3", name: "Theatre 3 (Minor)", status: "turnover" as const,
    currentCase: null,
  },
  {
    id: "or-4", name: "Theatre 4 (Ortho)", status: "available" as const,
    currentCase: null,
  },
  {
    id: "or-5", name: "Theatre 5 (Eye)", status: "maintenance" as const,
    currentCase: null,
  },
];

const MOCK_SCHEDULE = [
  { id: "s1", time: "08:00", patient: "T. Moyo", procedure: "Appendectomy", surgeon: "Dr. Ndlovu", theatre: "Theatre 1", status: "in_progress" as const, priority: "urgent" },
  { id: "s2", time: "08:30", patient: "S. Banda", procedure: "C-Section", surgeon: "Dr. Mukwena", theatre: "Theatre 2", status: "in_progress" as const, priority: "emergency" },
  { id: "s3", time: "10:00", patient: "M. Dube", procedure: "Hernia Repair", surgeon: "Dr. Sithole", theatre: "Theatre 1", status: "scheduled" as const, priority: "elective" },
  { id: "s4", time: "10:30", patient: "E. Ncube", procedure: "Skin Graft", surgeon: "Dr. Moyo", theatre: "Theatre 3", status: "pre_op" as const, priority: "elective" },
  { id: "s5", time: "11:00", patient: "L. Khumalo", procedure: "Cataract Surgery", surgeon: "Dr. Banda", theatre: "Theatre 5", status: "scheduled" as const, priority: "elective" },
  { id: "s6", time: "13:00", patient: "J. Phiri", procedure: "Cholecystectomy", surgeon: "Dr. Ndlovu", theatre: "Theatre 1", status: "scheduled" as const, priority: "elective" },
  { id: "s7", time: "14:00", patient: "R. Chuma", procedure: "Fracture Fixation", surgeon: "Dr. Mukwena", theatre: "Theatre 4", status: "scheduled" as const, priority: "urgent" },
];

const MOCK_RECOVERY = [
  { id: "r1", patient: "P. Mwale", procedure: "Laparoscopy", surgeon: "Dr. Sithole", admittedAt: new Date(Date.now() - 60 * 60000), status: "stable", painScore: 3, vitalsOk: true },
  { id: "r2", patient: "A. Moyo", procedure: "Tonsillectomy", surgeon: "Dr. Banda", admittedAt: new Date(Date.now() - 30 * 60000), status: "monitoring", painScore: 5, vitalsOk: true },
];

const MOCK_PREOP = [
  { id: "p1", patient: "M. Dube", procedure: "Hernia Repair", theatre: "Theatre 1", scheduledTime: "10:00", checklist: { consent: true, fasting: true, bloods: true, marking: false, anaesthesia: false }, priority: "elective" },
  { id: "p2", patient: "E. Ncube", procedure: "Skin Graft", theatre: "Theatre 3", scheduledTime: "10:30", checklist: { consent: true, fasting: true, bloods: false, marking: true, anaesthesia: false }, priority: "elective" },
];

function TheatreStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    in_use: { label: "In Use", className: "bg-primary/10 text-primary border-primary/30" },
    available: { label: "Available", className: "bg-success/10 text-success border-success/30" },
    turnover: { label: "Turnover", className: "bg-warning/10 text-warning border-warning/30" },
    maintenance: { label: "Maintenance", className: "bg-muted text-muted-foreground border-border" },
  };
  const c = config[status] || config.available;
  return <Badge variant="outline" className={cn("text-xs", c.className)}>{c.label}</Badge>;
}

function CasePhaseIndicator({ phase }: { phase: string }) {
  const phases = ["anaesthesia", "operation", "closing", "handover"];
  const idx = phases.indexOf(phase);
  return (
    <div className="flex items-center gap-1">
      {phases.map((p, i) => (
        <div key={p} className={cn("h-1.5 flex-1 rounded-full", i <= idx ? "bg-primary" : "bg-muted")} />
      ))}
    </div>
  );
}

export function TheatreManagementPanel() {
  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState("board");

  const theatresInUse = MOCK_THEATRES.filter(t => t.status === "in_use").length;
  const available = MOCK_THEATRES.filter(t => t.status === "available").length;

  return (
    <div className="space-y-4">
      {/* Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3 flex items-center gap-3">
            <Scissors className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-bold text-primary">{theatresInUse}</p>
              <p className="text-xs text-muted-foreground">Active Cases</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-3 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <div>
              <p className="text-xl font-bold text-success">{available}</p>
              <p className="text-xs text-muted-foreground">Available</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-warning/5 border-warning/20">
          <CardContent className="p-3 flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-warning" />
            <div>
              <p className="text-xl font-bold text-warning">{MOCK_PREOP.length}</p>
              <p className="text-xs text-muted-foreground">Pre-Op</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-info/5 border-info/20">
          <CardContent className="p-3 flex items-center gap-3">
            <Bed className="h-5 w-5 text-info" />
            <div>
              <p className="text-xl font-bold text-info">{MOCK_RECOVERY.length}</p>
              <p className="text-xs text-muted-foreground">Recovery</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted border-border">
          <CardContent className="p-3 flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xl font-bold">{MOCK_SCHEDULE.length}</p>
              <p className="text-xs text-muted-foreground">Scheduled Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Board / Schedule / Pre-Op / Recovery */}
      <Tabs value={activeView} onValueChange={setActiveView}>
        <div className="flex items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="board" className="gap-1.5"><Activity className="h-4 w-4" /> Theatre Board</TabsTrigger>
            <TabsTrigger value="schedule" className="gap-1.5"><CalendarDays className="h-4 w-4" /> Schedule</TabsTrigger>
            <TabsTrigger value="preop" className="gap-1.5"><ClipboardList className="h-4 w-4" /> Pre-Op</TabsTrigger>
            <TabsTrigger value="recovery" className="gap-1.5"><Bed className="h-4 w-4" /> Recovery</TabsTrigger>
          </TabsList>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search patients, procedures..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
        </div>

        {/* Theatre Board */}
        <TabsContent value="board" className="mt-4">
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {MOCK_THEATRES.map((theatre) => (
              <Card key={theatre.id} className={cn("relative overflow-hidden", theatre.status === "in_use" && "border-primary/30")}>
                <div className={cn("absolute top-0 left-0 right-0 h-1",
                  theatre.status === "in_use" ? "bg-primary" :
                  theatre.status === "available" ? "bg-success" :
                  theatre.status === "turnover" ? "bg-warning" : "bg-muted-foreground"
                )} />
                <CardHeader className="pb-2 pt-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{theatre.name}</CardTitle>
                    <TheatreStatusBadge status={theatre.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  {theatre.currentCase ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{theatre.currentCase.patient}</p>
                          <p className="text-sm text-muted-foreground">{theatre.currentCase.procedure}</p>
                        </div>
                        <Timer className="h-5 w-5 text-primary" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">{theatre.currentCase.surgeon}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">{theatre.currentCase.anaesthetist}</span>
                        </div>
                      </div>
                      <CasePhaseIndicator phase={theatre.currentCase.phase} />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {Math.round((Date.now() - theatre.currentCase.startTime.getTime()) / 60000)} min elapsed
                        </span>
                        <span className="text-muted-foreground">
                          Est. {theatre.currentCase.estimatedDuration} min
                        </span>
                      </div>
                      <Progress value={Math.min(100, ((Date.now() - theatre.currentCase.startTime.getTime()) / 60000 / theatre.currentCase.estimatedDuration) * 100)} className="h-1.5" />
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      {theatre.status === "turnover" ? (
                        <div className="flex flex-col items-center gap-2">
                          <RotateCcw className="h-8 w-8 animate-spin-slow" />
                          <p className="text-sm">Turnover in progress</p>
                          <Button size="sm" variant="outline">Mark Ready</Button>
                        </div>
                      ) : theatre.status === "maintenance" ? (
                        <div className="flex flex-col items-center gap-2">
                          <XCircle className="h-8 w-8" />
                          <p className="text-sm">Under maintenance</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle2 className="h-8 w-8 text-success" />
                          <p className="text-sm">Ready for next case</p>
                          <Button size="sm">Assign Case</Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Schedule */}
        <TabsContent value="schedule" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Today's Surgical Schedule</CardTitle>
              <CardDescription>All scheduled procedures for today</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="divide-y">
                  {MOCK_SCHEDULE.filter(s => !search || s.patient.toLowerCase().includes(search.toLowerCase()) || s.procedure.toLowerCase().includes(search.toLowerCase())).map((item) => (
                    <div key={item.id} className={cn("flex items-center justify-between p-4 hover:bg-muted/50 transition-colors",
                      item.status === "in_progress" && "bg-primary/5"
                    )}>
                      <div className="flex items-center gap-4">
                        <div className="text-center w-14 shrink-0">
                          <p className="font-bold text-lg">{item.time}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{item.patient}</p>
                            <Badge variant={item.priority === "emergency" ? "destructive" : item.priority === "urgent" ? "secondary" : "outline"} className="text-xs">
                              {item.priority}
                            </Badge>
                            {item.status === "in_progress" && <Badge className="text-xs bg-primary/10 text-primary border-primary/30">In Progress</Badge>}
                            {item.status === "pre_op" && <Badge className="text-xs bg-warning/10 text-warning border-warning/30">Pre-Op</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{item.procedure} • {item.surgeon} • {item.theatre}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost"><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pre-Op */}
        <TabsContent value="preop" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {MOCK_PREOP.map((item) => {
              const checklistItems = Object.entries(item.checklist);
              const completed = checklistItems.filter(([, v]) => v).length;
              const total = checklistItems.length;
              return (
                <Card key={item.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{item.patient}</CardTitle>
                      <Badge variant="outline" className="text-xs">{item.scheduledTime} • {item.theatre}</Badge>
                    </div>
                    <CardDescription>{item.procedure}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Pre-Op Checklist</span>
                      <span className={cn("font-medium", completed === total ? "text-success" : "text-warning")}>{completed}/{total}</span>
                    </div>
                    <Progress value={(completed / total) * 100} className="h-2" />
                    <div className="grid grid-cols-2 gap-2">
                      {checklistItems.map(([key, done]) => (
                        <div key={key} className={cn("flex items-center gap-2 text-sm p-2 rounded-lg", done ? "bg-success/10" : "bg-warning/10")}>
                          {done ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Clock className="h-4 w-4 text-warning" />}
                          <span className="capitalize">{key.replace(/_/g, " ")}</span>
                        </div>
                      ))}
                    </div>
                    {completed === total && (
                      <Button className="w-full" size="sm">
                        <PlayCircle className="h-4 w-4 mr-2" /> Ready for Theatre
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Recovery */}
        <TabsContent value="recovery" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recovery Room</CardTitle>
              <CardDescription>Post-operative monitoring</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="divide-y">
                  {MOCK_RECOVERY.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center",
                          item.vitalsOk ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                        )}>
                          <Activity className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{item.patient}</p>
                            <Badge variant={item.status === "stable" ? "outline" : "secondary"} className="text-xs">{item.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.procedure} • {item.surgeon}</p>
                          <p className="text-xs text-muted-foreground">
                            Pain: {item.painScore}/10 • {Math.round((Date.now() - item.admittedAt.getTime()) / 60000)} min in recovery
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">Vitals</Button>
                        <Button size="sm" variant="outline">Discharge</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
