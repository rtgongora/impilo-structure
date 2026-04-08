import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle, Clock, User, Activity, CheckCircle2,
  ChevronRight, Search, Ambulance, Heart, Zap, Timer,
  Bed, Stethoscope, ArrowUpDown, Users, ShieldAlert,
  Thermometer, Brain, Bone, Droplets
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

// South Africa Triage Scale (SATS) colors
const TRIAGE_LEVELS = {
  red: { label: "Emergency", color: "bg-red-600 text-white", border: "border-red-500", bg: "bg-red-50", text: "text-red-700", maxWait: "Immediate" },
  orange: { label: "Very Urgent", color: "bg-orange-500 text-white", border: "border-orange-400", bg: "bg-orange-50", text: "text-orange-700", maxWait: "10 min" },
  yellow: { label: "Urgent", color: "bg-yellow-400 text-black", border: "border-yellow-400", bg: "bg-yellow-50", text: "text-yellow-700", maxWait: "60 min" },
  green: { label: "Non-Urgent", color: "bg-green-500 text-white", border: "border-green-400", bg: "bg-green-50", text: "text-green-700", maxWait: "240 min" },
  blue: { label: "Dead / Dying", color: "bg-blue-800 text-white", border: "border-blue-700", bg: "bg-blue-50", text: "text-blue-700", maxWait: "—" },
};

type TriageLevel = keyof typeof TRIAGE_LEVELS;

const MOCK_PATIENTS = [
  { id: "c1", name: "J. Moyo", age: 45, sex: "M", triage: "red" as TriageLevel, complaint: "Chest pain, diaphoresis", arrivedAt: new Date(Date.now() - 5 * 60000), mode: "ambulance", area: "resus", gcs: 15, vitals: { hr: 110, bp: "90/60", spo2: 94, rr: 24 } },
  { id: "c2", name: "T. Sibanda", age: 28, sex: "F", triage: "orange" as TriageLevel, complaint: "MVA, head laceration, GCS 14", arrivedAt: new Date(Date.now() - 12 * 60000), mode: "ambulance", area: "acute", gcs: 14, vitals: { hr: 95, bp: "130/85", spo2: 97, rr: 18 } },
  { id: "c3", name: "M. Banda", age: 8, sex: "M", triage: "orange" as TriageLevel, complaint: "Febrile seizure, temp 39.8°C", arrivedAt: new Date(Date.now() - 20 * 60000), mode: "walk-in", area: "paeds", gcs: 15, vitals: { hr: 140, bp: "—", spo2: 98, rr: 28 } },
  { id: "c4", name: "E. Phiri", age: 62, sex: "F", triage: "yellow" as TriageLevel, complaint: "Fall, suspected # NOF", arrivedAt: new Date(Date.now() - 35 * 60000), mode: "walk-in", area: "acute", gcs: 15, vitals: { hr: 88, bp: "145/90", spo2: 96, rr: 16 } },
  { id: "c5", name: "L. Ncube", age: 34, sex: "M", triage: "yellow" as TriageLevel, complaint: "Deep laceration R forearm", arrivedAt: new Date(Date.now() - 50 * 60000), mode: "walk-in", area: "minor", gcs: 15, vitals: { hr: 78, bp: "125/80", spo2: 99, rr: 14 } },
  { id: "c6", name: "S. Dube", age: 22, sex: "F", triage: "green" as TriageLevel, complaint: "Sore throat, 2 days", arrivedAt: new Date(Date.now() - 90 * 60000), mode: "walk-in", area: "minor", gcs: 15, vitals: { hr: 72, bp: "115/75", spo2: 99, rr: 14 } },
  { id: "c7", name: "P. Chuma", age: 55, sex: "M", triage: "green" as TriageLevel, complaint: "Medication refill, chronic HTN", arrivedAt: new Date(Date.now() - 120 * 60000), mode: "walk-in", area: "minor", gcs: 15, vitals: { hr: 80, bp: "160/95", spo2: 98, rr: 16 } },
];

const AREAS = [
  { id: "resus", label: "Resus", icon: Zap, capacity: 2, occupied: 1, color: "text-red-600" },
  { id: "acute", label: "Acute Care", icon: Activity, capacity: 8, occupied: 3, color: "text-orange-500" },
  { id: "paeds", label: "Paediatric", icon: Heart, capacity: 4, occupied: 1, color: "text-pink-500" },
  { id: "minor", label: "Minor Injuries", icon: Bone, capacity: 6, occupied: 2, color: "text-green-600" },
  { id: "obs", label: "Observation", icon: Clock, capacity: 4, occupied: 2, color: "text-blue-500" },
];

const MOCK_INCOMING = [
  { id: "i1", eta: "5 min", type: "Trauma — MVA", crew: "EMS Unit 12", triage: "red" as TriageLevel },
  { id: "i2", eta: "12 min", type: "Medical — Stroke symptoms", crew: "EMS Unit 7", triage: "orange" as TriageLevel },
];

function TriageBadge({ level }: { level: TriageLevel }) {
  const config = TRIAGE_LEVELS[level];
  return <Badge className={cn("text-xs font-bold uppercase", config.color)}>{config.label}</Badge>;
}

export function CasualtyManagementPanel() {
  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState("tracking");
  const [triageFilter, setTriageFilter] = useState<TriageLevel | "all">("all");

  const filteredPatients = MOCK_PATIENTS.filter(p => {
    if (triageFilter !== "all" && p.triage !== triageFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.complaint.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const triageCounts = {
    red: MOCK_PATIENTS.filter(p => p.triage === "red").length,
    orange: MOCK_PATIENTS.filter(p => p.triage === "orange").length,
    yellow: MOCK_PATIENTS.filter(p => p.triage === "yellow").length,
    green: MOCK_PATIENTS.filter(p => p.triage === "green").length,
  };

  return (
    <div className="space-y-4">
      {/* Incoming Ambulances Alert */}
      {MOCK_INCOMING.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-3 mb-2">
              <Ambulance className="h-5 w-5 text-destructive animate-pulse" />
              <span className="font-semibold text-destructive">Incoming ({MOCK_INCOMING.length})</span>
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              {MOCK_INCOMING.map(inc => (
                <div key={inc.id} className="flex items-center justify-between bg-background rounded-lg p-2 border border-destructive/20">
                  <div className="flex items-center gap-2">
                    <TriageBadge level={inc.triage} />
                    <span className="text-sm font-medium">{inc.type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{inc.crew}</span>
                    <Badge variant="outline" className="font-bold">ETA {inc.eta}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Triage Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(Object.entries(triageCounts) as [TriageLevel, number][]).map(([level, count]) => {
          const config = TRIAGE_LEVELS[level];
          return (
            <Card
              key={level}
              className={cn("cursor-pointer transition-all hover:shadow-md", triageFilter === level && config.border, triageFilter === level && "ring-2 ring-offset-1")}
              style={triageFilter === level ? { borderColor: undefined } : {}}
              onClick={() => setTriageFilter(triageFilter === level ? "all" : level)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center font-bold text-lg", config.color)}>{count}</div>
                <div>
                  <p className={cn("font-semibold text-sm", config.text)}>{config.label}</p>
                  <p className="text-xs text-muted-foreground">Max wait: {config.maxWait}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
        <Card className="bg-muted/50">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center font-bold text-lg">{MOCK_PATIENTS.length}</div>
            <div>
              <p className="font-semibold text-sm">Total</p>
              <p className="text-xs text-muted-foreground">In department</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Area Capacity */}
      <div className="grid grid-cols-5 gap-2">
        {AREAS.map(area => {
          const Icon = area.icon;
          const pct = (area.occupied / area.capacity) * 100;
          return (
            <Card key={area.id} className="p-2">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={cn("h-4 w-4", area.color)} />
                <span className="text-xs font-medium">{area.label}</span>
              </div>
              <Progress value={pct} className="h-1.5 mb-1" />
              <p className="text-xs text-muted-foreground">{area.occupied}/{area.capacity} beds</p>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs value={activeView} onValueChange={setActiveView}>
        <div className="flex items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="tracking" className="gap-1.5"><Users className="h-4 w-4" /> Patient Tracking</TabsTrigger>
            <TabsTrigger value="triage" className="gap-1.5"><ArrowUpDown className="h-4 w-4" /> Triage Queue</TabsTrigger>
            <TabsTrigger value="areas" className="gap-1.5"><Bed className="h-4 w-4" /> Area View</TabsTrigger>
          </TabsList>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search patients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
        </div>

        {/* Patient Tracking Board */}
        <TabsContent value="tracking" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[450px]">
                <div className="divide-y">
                  {filteredPatients.map((patient) => (
                    <div key={patient.id} className={cn("flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                      patient.triage === "red" && "bg-red-50/50 dark:bg-red-950/10"
                    )}>
                      <div className="flex items-center gap-4">
                        <TriageBadge level={patient.triage} />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{patient.name}</p>
                            <span className="text-xs text-muted-foreground">{patient.age}{patient.sex} • GCS {patient.gcs}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{patient.complaint}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDistanceToNow(patient.arrivedAt, { addSuffix: true })}</span>
                            <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{AREAS.find(a => a.id === patient.area)?.label}</span>
                            <span className="flex items-center gap-1">{patient.mode === "ambulance" ? <Ambulance className="h-3 w-3" /> : <User className="h-3 w-3" />}{patient.mode}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <div className="text-xs"><p className="font-medium">{patient.vitals.hr}</p><p className="text-muted-foreground">HR</p></div>
                          <div className="text-xs"><p className="font-medium">{patient.vitals.bp}</p><p className="text-muted-foreground">BP</p></div>
                          <div className="text-xs"><p className={cn("font-medium", patient.vitals.spo2 < 95 && "text-destructive")}>{patient.vitals.spo2}%</p><p className="text-muted-foreground">SpO₂</p></div>
                          <div className="text-xs"><p className="font-medium">{patient.vitals.rr}</p><p className="text-muted-foreground">RR</p></div>
                        </div>
                        <Button size="sm" variant="ghost"><ChevronRight className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Triage Queue - sorted by priority */}
        <TabsContent value="triage" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-destructive" />
                Triage Queue (SATS)
              </CardTitle>
              <CardDescription>South African Triage Scale — patients sorted by acuity and wait time</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="divide-y">
                  {[...filteredPatients].sort((a, b) => {
                    const order: TriageLevel[] = ["red", "orange", "yellow", "green", "blue"];
                    const diff = order.indexOf(a.triage) - order.indexOf(b.triage);
                    if (diff !== 0) return diff;
                    return a.arrivedAt.getTime() - b.arrivedAt.getTime();
                  }).map((patient) => (
                    <div key={patient.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-2 h-12 rounded-full", TRIAGE_LEVELS[patient.triage].color)} />
                        <div>
                          <p className="font-semibold">{patient.name}</p>
                          <p className="text-sm text-muted-foreground">{patient.complaint}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right text-sm">
                          <p className="font-medium">{formatDistanceToNow(patient.arrivedAt)} waiting</p>
                          <p className="text-xs text-muted-foreground">Max: {TRIAGE_LEVELS[patient.triage].maxWait}</p>
                        </div>
                        <Button size="sm">Assess</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Area View */}
        <TabsContent value="areas" className="mt-4">
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {AREAS.map(area => {
              const Icon = area.icon;
              const areaPatients = filteredPatients.filter(p => p.area === area.id);
              return (
                <Card key={area.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Icon className={cn("h-4 w-4", area.color)} />
                        {area.label}
                      </CardTitle>
                      <Badge variant="outline">{areaPatients.length}/{area.capacity}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {areaPatients.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No patients</p>
                    ) : (
                      areaPatients.map(p => (
                        <div key={p.id} className={cn("flex items-center justify-between p-2 rounded-lg border", TRIAGE_LEVELS[p.triage].bg)}>
                          <div className="flex items-center gap-2">
                            <TriageBadge level={p.triage} />
                            <div>
                              <p className="text-sm font-medium">{p.name}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[180px]">{p.complaint}</p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">{formatDistanceToNow(p.arrivedAt)}</span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
