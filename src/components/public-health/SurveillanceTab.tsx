import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Radio, AlertTriangle, Plus, Search, Filter, Eye, CheckCircle, Clock, FileText } from "lucide-react";
import { useState } from "react";

const SURVEILLANCE_SIGNALS = [
  { id: "SIG-001", disease: "Acute Watery Diarrhoea", facility: "Parirenyatwa Hospital", cases: 5, threshold: 3, date: "2026-04-05", status: "breached", action: "investigate" },
  { id: "SIG-002", disease: "Measles (suspected)", facility: "Harare Central Hospital", cases: 2, threshold: 5, date: "2026-04-05", status: "monitoring", action: "watch" },
  { id: "SIG-003", disease: "Malaria", facility: "Chipinge District Hospital", cases: 34, threshold: 20, date: "2026-04-04", status: "breached", action: "respond" },
  { id: "SIG-004", disease: "Typhoid", facility: "Chitungwiza Central Hospital", cases: 8, threshold: 5, date: "2026-04-04", status: "breached", action: "investigate" },
  { id: "SIG-005", disease: "AFP (Acute Flaccid Paralysis)", facility: "United Bulawayo Hospitals", cases: 1, threshold: 1, date: "2026-04-03", status: "breached", action: "investigate" },
];

const WEEKLY_REPORTS = [
  { facility: "Parirenyatwa Hospital", week: "W14-2026", submitted: true, onTime: true, diseases: 12, zero: 8, positive: 4 },
  { facility: "Harare Central Hospital", week: "W14-2026", submitted: true, onTime: false, diseases: 12, zero: 10, positive: 2 },
  { facility: "Chitungwiza Central", week: "W14-2026", submitted: false, onTime: false, diseases: 12, zero: 0, positive: 0 },
  { facility: "Mpilo Hospital", week: "W14-2026", submitted: true, onTime: true, diseases: 12, zero: 11, positive: 1 },
  { facility: "Sally Mugabe Hospital", week: "W14-2026", submitted: true, onTime: true, diseases: 12, zero: 9, positive: 3 },
];

const CASE_REPORTS = [
  { id: "CBR-2026-0142", disease: "Cholera", patient: "CPID-***421", age: 34, sex: "F", facility: "Budiriro Clinic", date: "2026-04-05", status: "confirmed", outcome: "recovering" },
  { id: "CBR-2026-0143", disease: "Cholera", patient: "CPID-***422", age: 7, sex: "M", facility: "Budiriro Clinic", date: "2026-04-05", status: "suspected", outcome: "admitted" },
  { id: "CBR-2026-0144", disease: "Typhoid", patient: "CPID-***423", age: 22, sex: "F", facility: "Chitungwiza Central", date: "2026-04-04", status: "confirmed", outcome: "recovering" },
  { id: "CBR-2026-0145", disease: "Measles", patient: "CPID-***424", age: 3, sex: "M", facility: "Masvingo Provincial", date: "2026-04-04", status: "suspected", outcome: "admitted" },
  { id: "CBR-2026-0146", disease: "AFP", patient: "CPID-***425", age: 2, sex: "F", facility: "UBH", date: "2026-04-03", status: "under_investigation", outcome: "stable" },
];

export function SurveillanceTab() {
  const [filter, setFilter] = useState("all");

  return (
    <div className="space-y-4">
      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Signals This Week", value: "12", color: "text-destructive", sub: "5 breached" },
          { label: "Under Investigation", value: "7", color: "text-warning", sub: "3 field teams deployed" },
          { label: "Reporting Completeness", value: "89%", color: "text-primary", sub: "W14 — 134/150 facilities" },
          { label: "Timeliness", value: "76%", color: "text-warning", sub: "Target: 80%" },
          { label: "Active Case Reports", value: "46", color: "text-info", sub: "12 confirmed this week" },
        ].map((kpi, i) => (
          <Card key={i}>
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs font-medium">{kpi.label}</p>
              <p className="text-[10px] text-muted-foreground">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="signals" className="space-y-3">
        <TabsList>
          <TabsTrigger value="signals">Threshold Signals</TabsTrigger>
          <TabsTrigger value="cases">Case-Based Reports</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Aggregate (IDSR)</TabsTrigger>
        </TabsList>

        <TabsContent value="signals">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Signal Triage Queue</CardTitle>
                  <CardDescription>Automated threshold alerts from facility-level reporting</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Signals</SelectItem>
                      <SelectItem value="breached">Breached Only</SelectItem>
                      <SelectItem value="monitoring">Monitoring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Signal ID</TableHead>
                    <TableHead>Disease</TableHead>
                    <TableHead>Facility</TableHead>
                    <TableHead>Cases</TableHead>
                    <TableHead>Threshold</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SURVEILLANCE_SIGNALS.filter(s => filter === "all" || s.status === filter).map(sig => (
                    <TableRow key={sig.id}>
                      <TableCell className="font-mono text-xs">{sig.id}</TableCell>
                      <TableCell className="font-medium">{sig.disease}</TableCell>
                      <TableCell>{sig.facility}</TableCell>
                      <TableCell className="font-bold">{sig.cases}</TableCell>
                      <TableCell className="text-muted-foreground">{sig.threshold}</TableCell>
                      <TableCell>
                        <Badge className={sig.status === "breached" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}>
                          {sig.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{sig.date}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                          {sig.action === "investigate" && <><Eye className="h-3 w-3" /> Investigate</>}
                          {sig.action === "respond" && <><AlertTriangle className="h-3 w-3" /> Respond</>}
                          {sig.action === "watch" && <><Clock className="h-3 w-3" /> Monitor</>}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cases">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Case-Based Surveillance Reports</CardTitle>
                  <CardDescription>Individual case investigations for notifiable diseases</CardDescription>
                </div>
                <Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> New Case Report</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CBR ID</TableHead>
                    <TableHead>Disease</TableHead>
                    <TableHead>Patient (CPID)</TableHead>
                    <TableHead>Age/Sex</TableHead>
                    <TableHead>Facility</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Classification</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CASE_REPORTS.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.id}</TableCell>
                      <TableCell className="font-medium">{c.disease}</TableCell>
                      <TableCell className="font-mono text-xs">{c.patient}</TableCell>
                      <TableCell>{c.age}{c.sex}</TableCell>
                      <TableCell>{c.facility}</TableCell>
                      <TableCell className="text-xs">{c.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">{c.status.replace(/_/g, " ")}</Badge>
                      </TableCell>
                      <TableCell className="text-xs capitalize">{c.outcome}</TableCell>
                      <TableCell><Button variant="ghost" size="sm" className="h-7"><FileText className="h-3.5 w-3.5" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Weekly IDSR Aggregate Reporting</CardTitle>
                  <CardDescription>Facility reporting completeness and timeliness for current epidemiological week</CardDescription>
                </div>
                <Badge variant="outline">Week 14, 2026</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Facility</TableHead>
                    <TableHead>Week</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>On Time</TableHead>
                    <TableHead>Diseases Reported</TableHead>
                    <TableHead>Zero Reports</TableHead>
                    <TableHead>Positive</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {WEEKLY_REPORTS.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{r.facility}</TableCell>
                      <TableCell className="text-xs">{r.week}</TableCell>
                      <TableCell>
                        {r.submitted ? <CheckCircle className="h-4 w-4 text-success" /> : <Clock className="h-4 w-4 text-warning" />}
                      </TableCell>
                      <TableCell>
                        {r.submitted ? (r.onTime ? <Badge className="bg-success/10 text-success text-xs">On time</Badge> : <Badge className="bg-warning/10 text-warning text-xs">Late</Badge>) : "—"}
                      </TableCell>
                      <TableCell>{r.submitted ? r.diseases : "—"}</TableCell>
                      <TableCell>{r.submitted ? r.zero : "—"}</TableCell>
                      <TableCell>{r.submitted ? r.positive : "—"}</TableCell>
                      <TableCell>
                        {!r.submitted && <Button variant="outline" size="sm" className="h-7 text-xs">Send Reminder</Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
