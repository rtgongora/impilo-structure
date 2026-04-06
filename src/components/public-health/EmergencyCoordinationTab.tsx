import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Siren, Shield, Users, Phone, FileText, Plus, AlertTriangle, CheckCircle, Clock, Radio, Building } from "lucide-react";

const EOC_STATUS = { level: "Level 2 — Enhanced Response", active: true, activatedAt: "2026-04-02 14:30", incident: "Cholera Outbreak — Harare South", commander: "Dr. M. Nyathi (Provincial PEHO)" };

const SITUATION_REPORTS = [
  { id: "SITREP-014", date: "2026-04-06 06:00", author: "Dr. M. Nyathi", period: "24hr", newCases: 8, totalCases: 47, deaths: 0, status: "published" },
  { id: "SITREP-013", date: "2026-04-05 06:00", author: "Dr. M. Nyathi", period: "24hr", newCases: 12, totalCases: 39, deaths: 1, status: "published" },
  { id: "SITREP-012", date: "2026-04-04 06:00", author: "Sr. T. Moyo", period: "24hr", newCases: 6, totalCases: 27, deaths: 0, status: "published" },
  { id: "SITREP-011", date: "2026-04-03 06:00", author: "Dr. M. Nyathi", period: "24hr", newCases: 9, totalCases: 21, deaths: 1, status: "published" },
];

const RESOURCES = [
  { type: "ORS Sachets", requested: 5000, mobilized: 3200, deployed: 2800, source: "WHO / UNICEF" },
  { type: "Cholera Kits", requested: 200, mobilized: 200, deployed: 150, source: "Central Medical Stores" },
  { type: "Water Purification Tablets", requested: 10000, mobilized: 8000, deployed: 6500, source: "ZINWA" },
  { type: "Body Bags", requested: 50, mobilized: 50, deployed: 10, source: "Red Cross" },
  { type: "PPE Sets", requested: 300, mobilized: 300, deployed: 250, source: "MOHCC" },
  { type: "IV Fluids (Ringer's Lactate)", requested: 1000, mobilized: 600, deployed: 400, source: "NatPharm" },
];

const CONTACTS = [
  { name: "Dr. M. Nyathi", role: "Incident Commander / PEHO", org: "MoHCC", phone: "+263-77-XXX-1234", available: true },
  { name: "Mr. J. Chigumba", role: "Logistics Lead", org: "City of Harare", phone: "+263-77-XXX-2345", available: true },
  { name: "Sr. R. Maposa", role: "Epidemiologist", org: "WHO Zimbabwe", phone: "+263-77-XXX-3456", available: true },
  { name: "Mr. T. Matamba", role: "WASH Coordinator", org: "UNICEF", phone: "+263-77-XXX-4567", available: false },
  { name: "Dr. S. Hwende", role: "Clinical Lead — CTC", org: "Parirenyatwa Hospital", phone: "+263-77-XXX-5678", available: true },
];

export function EmergencyCoordinationTab() {
  return (
    <div className="space-y-4">
      {/* EOC Status Banner */}
      <Card className={EOC_STATUS.active ? "border-destructive/50 bg-destructive/5" : ""}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Siren className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold">{EOC_STATUS.level}</h3>
                  <Badge className="bg-destructive text-destructive-foreground">ACTIVE</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{EOC_STATUS.incident}</p>
                <p className="text-xs text-muted-foreground">Commander: {EOC_STATUS.commander} • Activated: {EOC_STATUS.activatedAt}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Escalate to Level 3</Button>
              <Button variant="destructive" size="sm">Deactivate EOC</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="sitreps" className="space-y-3">
        <TabsList>
          <TabsTrigger value="sitreps">Situation Reports</TabsTrigger>
          <TabsTrigger value="resources">Resource Mobilization</TabsTrigger>
          <TabsTrigger value="contacts">Agency Directory</TabsTrigger>
          <TabsTrigger value="iap">Incident Action Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="sitreps">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Situation Reports (SitRep)</CardTitle>
                <Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> New SitRep</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SitRep ID</TableHead>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>New Cases</TableHead>
                    <TableHead>Cumulative</TableHead>
                    <TableHead>Deaths</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SITUATION_REPORTS.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.id}</TableCell>
                      <TableCell className="text-xs">{s.date}</TableCell>
                      <TableCell>{s.author}</TableCell>
                      <TableCell>{s.period}</TableCell>
                      <TableCell className="font-bold">{s.newCases}</TableCell>
                      <TableCell>{s.totalCases}</TableCell>
                      <TableCell>{s.deaths}</TableCell>
                      <TableCell><Badge className="bg-success/10 text-success text-xs">{s.status}</Badge></TableCell>
                      <TableCell><Button variant="ghost" size="sm" className="h-7"><FileText className="h-3.5 w-3.5" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Resource Mobilization Tracker</CardTitle>
                <Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> Request Resource</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resource</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Mobilized</TableHead>
                    <TableHead>Deployed</TableHead>
                    <TableHead>Pipeline</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {RESOURCES.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{r.type}</TableCell>
                      <TableCell className="text-xs">{r.source}</TableCell>
                      <TableCell>{r.requested.toLocaleString()}</TableCell>
                      <TableCell>{r.mobilized.toLocaleString()}</TableCell>
                      <TableCell>{r.deployed.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={(r.deployed / r.requested) * 100} className="h-2 w-20" />
                          <span className="text-xs text-muted-foreground">{Math.round((r.deployed / r.requested) * 100)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Inter-Agency Contact Directory</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Availability</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CONTACTS.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.role}</TableCell>
                      <TableCell>{c.org}</TableCell>
                      <TableCell className="font-mono text-xs">{c.phone}</TableCell>
                      <TableCell>
                        <Badge className={c.available ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}>
                          {c.available ? "Available" : "Unavailable"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="iap">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Incident Action Plan (IAP)</CardTitle>
              <CardDescription>Operational objectives and response strategy for current activation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Response Objectives</h4>
                  {[
                    { obj: "Reduce case fatality rate below 1%", status: "on_track", progress: 75 },
                    { obj: "Achieve 100% contact tracing within 48hrs", status: "at_risk", progress: 60 },
                    { obj: "Ensure safe water access in affected wards", status: "on_track", progress: 85 },
                    { obj: "Establish cholera treatment centres x3", status: "completed", progress: 100 },
                    { obj: "Community health education — 50,000 households", status: "in_progress", progress: 45 },
                  ].map((o, i) => (
                    <div key={i} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{o.obj}</span>
                        <Badge variant="outline" className="text-xs capitalize">{o.status.replace(/_/g, " ")}</Badge>
                      </div>
                      <Progress value={o.progress} className="h-2" />
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Command Notes</h4>
                  <Textarea placeholder="Enter incident commander notes..." className="min-h-[200px]" />
                  <Button size="sm">Save Notes</Button>
                  <h4 className="text-sm font-semibold mt-4">Response Timeline</h4>
                  <div className="space-y-2 text-sm">
                    {[
                      { time: "Apr 2, 14:30", event: "EOC activated — Level 2" },
                      { time: "Apr 2, 16:00", event: "First response teams deployed to Budiriro" },
                      { time: "Apr 3, 08:00", event: "CTC established at Budiriro Clinic" },
                      { time: "Apr 4, 10:00", event: "Water sampling initiated — 12 sites" },
                      { time: "Apr 5, 06:00", event: "WHO technical support team arrives" },
                    ].map((e, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <span className="text-xs text-muted-foreground w-28 shrink-0">{e.time}</span>
                        <span>{e.event}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
