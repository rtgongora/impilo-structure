// ServicePointWorkspace — renders the correct workspace view for each service point
import React, { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Search, UserPlus, ClipboardCheck, Users, Clock, Activity,
  Stethoscope, Pill, FlaskConical, ScanLine, Syringe, DollarSign,
  Bed, Shield, ArrowRight, AlertTriangle, CheckCircle2, Timer,
  FileText, Heart, Phone, Radio, TrendingUp, BarChart3,
} from "lucide-react";
import type { ServicePointType } from "./ServicePointSelector";

interface ServicePointWorkspaceProps {
  servicePoint: ServicePointType;
  facilityName: string;
  facilityId: string;
}

export function ServicePointWorkspace({ servicePoint, facilityName, facilityId }: ServicePointWorkspaceProps) {
  const workspaces: Record<ServicePointType, () => React.ReactNode> = {
    "front-desk": () => <FrontDeskWorkspace />,
    "triage": () => <TriageWorkspace />,
    "consultation": () => <ConsultationWorkspace />,
    "nursing-station": () => <NursingStationWorkspace />,
    "pharmacy": () => <PharmacyWorkspace />,
    "laboratory": () => <LaboratoryWorkspace />,
    "radiology": () => <RadiologyWorkspace />,
    "theatre": () => <TheatreWorkspace />,
    "billing": () => <BillingWorkspace />,
    "supervisor": () => <SupervisorWorkspace facilityName={facilityName} />,
    "emergency": () => <EmergencyWorkspace />,
    "inpatient": () => <InpatientWorkspace />,
    "casualty": () => <CasualtyWorkspace />,
    "procedure-room": () => <ProcedureRoomWorkspace />,
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {workspaces[servicePoint]?.()}
      </div>
    </ScrollArea>
  );
}

// ─── Mock data helpers ───
const mockPatients = [
  { id: "1", name: "Tendai Moyo", mrn: "MRN-001234", age: 34, sex: "M", status: "waiting", waitTime: 12, priority: "normal" },
  { id: "2", name: "Grace Nhamo", mrn: "MRN-001890", age: 28, sex: "F", status: "waiting", waitTime: 25, priority: "urgent" },
  { id: "3", name: "Farai Dube", mrn: "MRN-002345", age: 45, sex: "M", status: "in-service", waitTime: 0, priority: "normal" },
  { id: "4", name: "Rumbi Chikwava", mrn: "MRN-003012", age: 67, sex: "F", status: "waiting", waitTime: 8, priority: "emergency" },
  { id: "5", name: "Tinashe Gomo", mrn: "MRN-003456", age: 22, sex: "M", status: "completed", waitTime: 0, priority: "normal" },
];

function StatCard({ label, value, icon: Icon, trend, color = "text-primary" }: { label: string; value: string | number; icon: React.ElementType; trend?: string; color?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {trend && <p className="text-xs text-muted-foreground mt-0.5">{trend}</p>}
          </div>
          <div className={`h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PatientRow({ p, actions }: { p: typeof mockPatients[0]; actions?: React.ReactNode }) {
  const priorityColors: Record<string, string> = {
    emergency: "bg-red-500",
    urgent: "bg-orange-500",
    normal: "bg-green-500",
  };
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`h-2 w-2 rounded-full ${priorityColors[p.priority] || "bg-muted"}`} />
        <div>
          <p className="text-sm font-medium">{p.name}</p>
          <p className="text-xs text-muted-foreground">{p.mrn} • {p.age}{p.sex} {p.waitTime > 0 ? `• ${p.waitTime} min wait` : ""}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={p.status === "waiting" ? "secondary" : p.status === "in-service" ? "default" : "outline"} className="text-[10px]">
          {p.status}
        </Badge>
        {actions}
      </div>
    </div>
  );
}

// ─── Front Desk ───
function FrontDeskWorkspace() {
  const [search, setSearch] = useState("");
  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Waiting" value={12} icon={Users} />
        <StatCard label="Checked In" value={8} icon={ClipboardCheck} />
        <StatCard label="Avg Wait" value="14 min" icon={Clock} />
        <StatCard label="Registered Today" value={23} icon={UserPlus} />
      </div>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Patient Search & Check-in</CardTitle>
            <Button size="sm" className="gap-1"><UserPlus className="h-3.5 w-3.5" /> New Registration</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, MRN, Impilo ID, or phone..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="space-y-2">
            {mockPatients.filter(p => p.status !== "completed").map(p => (
              <PatientRow key={p.id} p={p} actions={
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.success(`${p.name} checked in`)}>Check In</Button>
              } />
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// ─── Triage ───
function TriageWorkspace() {
  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Awaiting Triage" value={5} icon={Activity} color="text-orange-500" />
        <StatCard label="In Triage" value={2} icon={Stethoscope} />
        <StatCard label="Fast-tracked" value={1} icon={ArrowRight} color="text-red-500" />
        <StatCard label="Completed Today" value={18} icon={CheckCircle2} color="text-green-500" />
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Triage Queue</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {mockPatients.filter(p => p.status === "waiting").map(p => (
            <PatientRow key={p.id} p={p} actions={
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.success(`Starting triage for ${p.name}`)}>Triage</Button>
                {p.priority === "emergency" && <Button size="sm" variant="destructive" className="h-7 text-xs">Fast-track</Button>}
              </div>
            } />
          ))}
        </CardContent>
      </Card>
    </>
  );
}

// ─── Consultation ───
function ConsultationWorkspace() {
  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="My Patients" value={6} icon={Users} />
        <StatCard label="Pending Orders" value={3} icon={FileText} />
        <StatCard label="Results Ready" value={2} icon={FlaskConical} color="text-green-500" />
        <StatCard label="Referrals" value={1} icon={ArrowRight} />
      </div>
      <Tabs defaultValue="queue" className="w-full">
        <TabsList><TabsTrigger value="queue">Patient Queue</TabsTrigger><TabsTrigger value="active">Active Encounter</TabsTrigger><TabsTrigger value="results">Results</TabsTrigger></TabsList>
        <TabsContent value="queue">
          <Card><CardContent className="p-4 space-y-2">
            {mockPatients.filter(p => p.status !== "completed").map(p => (
              <PatientRow key={p.id} p={p} actions={
                <Button size="sm" className="h-7 text-xs gap-1" onClick={() => toast.success(`Opening encounter for ${p.name}`)}>
                  <Stethoscope className="h-3 w-3" /> Consult
                </Button>
              } />
            ))}
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="active">
          <Card><CardContent className="p-6 text-center text-muted-foreground">Select a patient from the queue to begin consultation</CardContent></Card>
        </TabsContent>
        <TabsContent value="results">
          <Card><CardContent className="p-4 space-y-2">
            <div className="p-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Full Blood Count — Tendai Moyo</p><p className="text-xs text-muted-foreground">Completed 15 min ago</p></div>
                <Button size="sm" variant="outline" className="h-7 text-xs">View</Button>
              </div>
            </div>
            <div className="p-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Chest X-ray — Grace Nhamo</p><p className="text-xs text-muted-foreground">Completed 42 min ago</p></div>
                <Button size="sm" variant="outline" className="h-7 text-xs">View</Button>
              </div>
            </div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

// ─── Nursing Station ───
function NursingStationWorkspace() {
  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Admitted" value={24} icon={Bed} />
        <StatCard label="Pending Meds" value={8} icon={Pill} color="text-orange-500" />
        <StatCard label="Observations Due" value={5} icon={Activity} color="text-amber-500" />
        <StatCard label="Handover Items" value={3} icon={FileText} />
      </div>
      <Tabs defaultValue="tasks">
        <TabsList><TabsTrigger value="tasks">Tasks</TabsTrigger><TabsTrigger value="bedboard">Bed Board</TabsTrigger><TabsTrigger value="handover">Handover</TabsTrigger></TabsList>
        <TabsContent value="tasks">
          <Card><CardContent className="p-4 space-y-2">
            {["Administer Paracetamol 1g — Bed 4A (Tendai M.)", "Vitals check — Bed 7B (Grace N.)", "IV fluid change — Bed 2C (Farai D.)", "Wound dressing — Bed 9A (Rumbi C.)"].map((task, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${i === 0 ? "bg-red-500" : "bg-amber-500"}`} />
                  <span className="text-sm">{task}</span>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.success("Task completed")}>Done</Button>
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="bedboard"><Card><CardContent className="p-6 text-center text-muted-foreground">Bed board view with ward occupancy</CardContent></Card></TabsContent>
        <TabsContent value="handover"><Card><CardContent className="p-6 text-center text-muted-foreground">Shift handover summary</CardContent></Card></TabsContent>
      </Tabs>
    </>
  );
}

// ─── Pharmacy ───
function PharmacyWorkspace() {
  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Rx Queue" value={7} icon={Pill} color="text-green-500" />
        <StatCard label="Dispensed Today" value={34} icon={CheckCircle2} color="text-green-500" />
        <StatCard label="Low Stock Items" value={3} icon={AlertTriangle} color="text-amber-500" />
        <StatCard label="Controlled Substances" value={2} icon={Shield} />
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Prescription Queue</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[
            { name: "Tendai Moyo", rx: "Amoxicillin 500mg TDS x 7 days", priority: "normal" },
            { name: "Grace Nhamo", rx: "Metformin 500mg BD + Amlodipine 5mg OD", priority: "urgent" },
            { name: "Rumbi Chikwava", rx: "Morphine 10mg Q4H (controlled)", priority: "emergency" },
          ].map((rx, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <p className="text-sm font-medium">{rx.name}</p>
                <p className="text-xs text-muted-foreground">{rx.rx}</p>
              </div>
              <Button size="sm" className="h-7 text-xs" onClick={() => toast.success(`Dispensed to ${rx.name}`)}>Dispense</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

// ─── Laboratory ───
function LaboratoryWorkspace() {
  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Pending Orders" value={9} icon={FlaskConical} color="text-indigo-500" />
        <StatCard label="In Progress" value={4} icon={Timer} />
        <StatCard label="Results Ready" value={6} icon={CheckCircle2} color="text-green-500" />
        <StatCard label="STAT Orders" value={2} icon={AlertTriangle} color="text-red-500" />
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Order Queue</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[
            { name: "Full Blood Count", patient: "Tendai Moyo", status: "pending", stat: false },
            { name: "Renal Function", patient: "Grace Nhamo", status: "in-progress", stat: true },
            { name: "Liver Function + Lipids", patient: "Farai Dube", status: "pending", stat: false },
          ].map((order, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                {order.stat && <Badge variant="destructive" className="text-[10px]">STAT</Badge>}
                <div>
                  <p className="text-sm font-medium">{order.name}</p>
                  <p className="text-xs text-muted-foreground">{order.patient}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.success(`Processing ${order.name}`)}>
                {order.status === "pending" ? "Accept" : "Enter Results"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

// ─── Radiology ───
function RadiologyWorkspace() {
  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Imaging Queue" value={5} icon={ScanLine} color="text-cyan-500" />
        <StatCard label="Completed" value={12} icon={CheckCircle2} color="text-green-500" />
        <StatCard label="Reports Pending" value={3} icon={FileText} />
        <StatCard label="STAT" value={1} icon={AlertTriangle} color="text-red-500" />
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Imaging Queue</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[
            { name: "Chest X-ray AP", patient: "Grace Nhamo", modality: "X-Ray" },
            { name: "CT Abdomen", patient: "Farai Dube", modality: "CT" },
            { name: "Ultrasound Obstetric", patient: "Rumbi Chikwava", modality: "US" },
          ].map((img, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <p className="text-sm font-medium">{img.name}</p>
                <p className="text-xs text-muted-foreground">{img.patient} • {img.modality}</p>
              </div>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.success(`Acquiring ${img.name}`)}>Acquire</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

// ─── Theatre ───
function TheatreWorkspace() {
  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Today's Cases" value={4} icon={Syringe} color="text-rose-500" />
        <StatCard label="In Progress" value={1} icon={Activity} />
        <StatCard label="Recovery" value={2} icon={Heart} />
        <StatCard label="Cancelled" value={0} icon={AlertTriangle} />
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Theatre Schedule</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[
            { procedure: "Appendicectomy", patient: "Tendai Moyo", time: "08:00", theatre: "Theatre 1", status: "completed" },
            { procedure: "Caesarean Section", patient: "Grace Nhamo", time: "10:30", theatre: "Theatre 2", status: "in-progress" },
            { procedure: "Hernia Repair", patient: "Farai Dube", time: "14:00", theatre: "Theatre 1", status: "scheduled" },
          ].map((c, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <p className="text-sm font-medium">{c.procedure}</p>
                <p className="text-xs text-muted-foreground">{c.patient} • {c.time} • {c.theatre}</p>
              </div>
              <Badge variant={c.status === "completed" ? "secondary" : c.status === "in-progress" ? "default" : "outline"} className="text-[10px]">{c.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

// ─── Emergency ───
function EmergencyWorkspace() {
  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Resus Bay" value={1} icon={Radio} color="text-red-500" />
        <StatCard label="Acute" value={4} icon={AlertTriangle} color="text-orange-500" />
        <StatCard label="Waiting" value={7} icon={Users} />
        <StatCard label="4hr Breaches" value={2} icon={Clock} color="text-red-500" />
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Emergency Department</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {mockPatients.filter(p => p.status !== "completed").map(p => (
            <PatientRow key={p.id} p={p} actions={
              <Button size="sm" variant={p.priority === "emergency" ? "destructive" : "outline"} className="h-7 text-xs" onClick={() => toast.success(`Attending to ${p.name}`)}>
                {p.priority === "emergency" ? "RESUS" : "Assess"}
              </Button>
            } />
          ))}
        </CardContent>
      </Card>
    </>
  );
}

// ─── Inpatient ───
function InpatientWorkspace() {
  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Admitted" value={24} icon={Bed} />
        <StatCard label="Admissions Today" value={3} icon={UserPlus} />
        <StatCard label="Discharges Today" value={2} icon={ArrowRight} color="text-green-500" />
        <StatCard label="Bed Occupancy" value="87%" icon={TrendingUp} />
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Ward Overview</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {["Medical Ward", "Surgical Ward", "Paediatrics"].map(ward => (
              <Card key={ward}>
                <CardContent className="p-3">
                  <p className="text-sm font-medium">{ward}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Beds: 20</span><span>Occupied: {Math.floor(Math.random() * 5 + 15)}</span>
                  </div>
                  <Progress value={Math.floor(Math.random() * 30 + 70)} className="mt-2 h-1.5" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// ─── Billing ───
function BillingWorkspace() {
  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Pending Bills" value={8} icon={DollarSign} color="text-amber-500" />
        <StatCard label="Collected Today" value="$2,340" icon={DollarSign} color="text-green-500" />
        <StatCard label="Outstanding" value="$12,450" icon={AlertTriangle} color="text-red-500" />
        <StatCard label="Claims Submitted" value={5} icon={FileText} />
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Billing Queue</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[
            { name: "Tendai Moyo", amount: "$45.00", type: "Consultation", status: "pending" },
            { name: "Grace Nhamo", amount: "$320.00", type: "Theatre + Ward", status: "pending" },
            { name: "Farai Dube", amount: "$85.00", type: "Lab + Imaging", status: "partial" },
          ].map((bill, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <p className="text-sm font-medium">{bill.name}</p>
                <p className="text-xs text-muted-foreground">{bill.type} • {bill.amount}</p>
              </div>
              <Button size="sm" className="h-7 text-xs" onClick={() => toast.success(`Payment processed for ${bill.name}`)}>Collect</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

// ─── Supervisor ───
function SupervisorWorkspace({ facilityName }: { facilityName: string }) {
  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Active Staff" value={18} icon={Users} />
        <StatCard label="Queue Length" value={24} icon={Clock} />
        <StatCard label="Bed Occupancy" value="87%" icon={Bed} />
        <StatCard label="Pending Approvals" value={4} icon={Shield} />
      </div>
      <Tabs defaultValue="overview">
        <TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="staff">Staff</TabsTrigger><TabsTrigger value="reports">Reports</TabsTrigger><TabsTrigger value="approvals">Approvals</TabsTrigger></TabsList>
        <TabsContent value="overview">
          <div className="grid grid-cols-2 gap-3">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Service Points Active</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {["Front Desk (2)", "Triage (1)", "Consultation (3)", "Pharmacy (2)", "Lab (2)"].map(sp => (
                  <div key={sp} className="flex items-center justify-between text-sm">
                    <span>{sp}</span>
                    <Badge variant="outline" className="text-[10px]">Active</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Key Metrics</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: "Avg Wait Time", value: "14 min" },
                  { label: "Patient Throughput", value: "42 today" },
                  { label: "Revenue Today", value: "$4,230" },
                  { label: "Stockouts", value: "2 items" },
                ].map(m => (
                  <div key={m.label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className="font-medium">{m.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="staff"><Card><CardContent className="p-6 text-center text-muted-foreground">Staff roster and assignment view</CardContent></Card></TabsContent>
        <TabsContent value="reports"><Card><CardContent className="p-6 text-center text-muted-foreground">Facility operational reports</CardContent></Card></TabsContent>
        <TabsContent value="approvals"><Card><CardContent className="p-6 text-center text-muted-foreground">Pending approvals and authorisations</CardContent></Card></TabsContent>
      </Tabs>
    </>
  );
}

// ─── Casualty (Emergency Department) ───
function CasualtyWorkspace() {
  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Resus Bay" value={1} icon={Radio} color="text-red-500" />
        <StatCard label="Acute Area" value={6} icon={AlertTriangle} color="text-orange-500" />
        <StatCard label="Sub-Acute" value={9} icon={Users} />
        <StatCard label="4hr Breaches" value={3} icon={Clock} color="text-red-500" />
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Casualty / ED Board</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[
            { name: "Tafadzwa Chinyama", complaint: "Chest pain", triage: "Red", time: "08:12", area: "Resus" },
            { name: "Rumbidzai Moyo", complaint: "RTA — limb injuries", triage: "Orange", time: "08:45", area: "Acute" },
            { name: "Blessing Ncube", complaint: "Abdominal pain", triage: "Yellow", time: "09:20", area: "Sub-Acute" },
            { name: "Chipo Dube", complaint: "Laceration — hand", triage: "Green", time: "09:55", area: "Minor" },
          ].map((p, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <Badge variant={p.triage === "Red" ? "destructive" : "outline"} className="text-[10px] w-14 justify-center">{p.triage}</Badge>
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.complaint} • {p.area} • {p.time}</p>
                </div>
              </div>
              <Button size="sm" variant={p.triage === "Red" ? "destructive" : "outline"} className="h-7 text-xs" onClick={() => toast.success(`Attending ${p.name}`)}>
                {p.triage === "Red" ? "RESUS" : "Assess"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

// ─── Procedure Room ───
function ProcedureRoomWorkspace() {
  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Scheduled" value={5} icon={Syringe} />
        <StatCard label="In Progress" value={1} icon={Activity} color="text-blue-500" />
        <StatCard label="Recovery" value={2} icon={Heart} color="text-green-500" />
        <StatCard label="Completed Today" value={3} icon={FileText} />
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Procedure Schedule</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[
            { procedure: "Incision & Drainage", patient: "Munyaradzi Banda", time: "08:30", room: "Proc Room 1", status: "completed" },
            { procedure: "Wound Debridement", patient: "Tatenda Zvobgo", time: "10:00", room: "Proc Room 1", status: "in-progress" },
            { procedure: "Punch Biopsy", patient: "Nyasha Mutasa", time: "11:30", room: "Proc Room 2", status: "scheduled" },
            { procedure: "Joint Aspiration", patient: "Kudzai Maposa", time: "14:00", room: "Proc Room 1", status: "scheduled" },
            { procedure: "Conscious Sedation — Reduction", patient: "Rudo Chigwe", time: "15:00", room: "Proc Room 2", status: "scheduled" },
          ].map((c, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <p className="text-sm font-medium">{c.procedure}</p>
                <p className="text-xs text-muted-foreground">{c.patient} • {c.time} • {c.room}</p>
              </div>
              <Badge variant={c.status === "completed" ? "secondary" : c.status === "in-progress" ? "default" : "outline"} className="text-[10px]">{c.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
