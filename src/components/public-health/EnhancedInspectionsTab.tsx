import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardCheck, Plus, Calendar, AlertTriangle, CheckCircle, Eye, Clock, FileText, Star } from "lucide-react";

const INSPECTIONS = [
  { id: "INS-001", site: "Mbare Musika Market", siteType: "Market", type: "Routine Food Safety", inspector: "J. Moyo", date: "2026-04-08", status: "completed", score: 72, findings: 3, critical: 0, followUp: "2026-05-08" },
  { id: "INS-002", site: "Eastlea Swimming Pool", siteType: "Recreation", type: "Water Quality", inspector: "T. Ndlovu", date: "2026-04-09", status: "scheduled", score: null, findings: 0, critical: 0, followUp: null },
  { id: "INS-003", site: "Southerton Abattoir", siteType: "Abattoir", type: "Meat Safety", inspector: "P. Chirwa", date: "2026-04-07", status: "completed", score: 45, findings: 7, critical: 2, followUp: "2026-04-14" },
  { id: "INS-004", site: "Corner Bakery - Avondale", siteType: "Food Premises", type: "Food Premises", inspector: "S. Makoni", date: "2026-04-10", status: "in_progress", score: null, findings: 1, critical: 0, followUp: null },
  { id: "INS-005", site: "Glen Norah Borehole #3", siteType: "Water Point", type: "Water Source", inspector: "R. Dube", date: "2026-04-06", status: "completed", score: 88, findings: 1, critical: 0, followUp: null },
  { id: "INS-006", site: "CBD Street Vendor Zone", siteType: "Vending Zone", type: "Food Safety", inspector: "J. Moyo", date: "2026-04-11", status: "scheduled", score: null, findings: 0, critical: 0, followUp: null },
];

const ENFORCEMENT_ACTIONS = [
  { id: "ENF-001", site: "Southerton Abattoir", violation: "Unsanitary slaughter conditions", severity: "critical", action: "Closure Notice", issued: "2026-04-07", deadline: "2026-04-14", status: "pending_compliance" },
  { id: "ENF-002", site: "Happy Foods Takeaway", violation: "Expired food storage", severity: "high", action: "Improvement Notice", issued: "2026-03-28", deadline: "2026-04-11", status: "complied" },
  { id: "ENF-003", site: "Greendale Swimming Pool", violation: "Chlorine levels below minimum", severity: "medium", action: "Warning Letter", issued: "2026-03-25", deadline: "2026-04-08", status: "complied" },
];

const COMPLIANCE_SUMMARY = [
  { category: "Food Premises", total: 342, compliant: 289, rate: 84 },
  { category: "Water Points", total: 156, compliant: 142, rate: 91 },
  { category: "Markets", total: 28, compliant: 19, rate: 68 },
  { category: "Abattoirs", total: 12, compliant: 8, rate: 67 },
  { category: "Schools", total: 89, compliant: 78, rate: 88 },
  { category: "Public Facilities", total: 45, compliant: 38, rate: 84 },
];

export function EnhancedInspectionsTab() {
  return (
    <div className="space-y-4">
      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Inspections This Month", value: "142", icon: ClipboardCheck },
          { label: "Scheduled (Upcoming)", value: "23", icon: Calendar },
          { label: "Critical Findings", value: "4", icon: AlertTriangle },
          { label: "Avg Compliance Score", value: "78%", icon: Star },
          { label: "Active Enforcement", value: "6", icon: FileText },
        ].map((kpi, i) => (
          <Card key={i}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><kpi.icon className="h-4 w-4 text-primary" /></div>
              <div>
                <p className="text-lg font-bold">{kpi.value}</p>
                <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="inspections" className="space-y-3">
        <TabsList>
          <TabsTrigger value="inspections">Inspection Register</TabsTrigger>
          <TabsTrigger value="enforcement">Enforcement Actions</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="inspections">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Inspection Register</CardTitle>
                  <CardDescription>Linked to INDAWO sites — routine, ad-hoc, and follow-up inspections</CardDescription>
                </div>
                <Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> Schedule Inspection</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Site Type</TableHead>
                    <TableHead>Inspection Type</TableHead>
                    <TableHead>Inspector</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Findings</TableHead>
                    <TableHead>Follow-up</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {INSPECTIONS.map(ins => (
                    <TableRow key={ins.id}>
                      <TableCell className="font-mono text-xs">{ins.id}</TableCell>
                      <TableCell className="font-medium">{ins.site}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{ins.siteType}</Badge></TableCell>
                      <TableCell>{ins.type}</TableCell>
                      <TableCell>{ins.inspector}</TableCell>
                      <TableCell className="text-xs">{ins.date}</TableCell>
                      <TableCell>
                        <Badge className={
                          ins.status === "completed" ? "bg-success/10 text-success" :
                          ins.status === "in_progress" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        }>{ins.status.replace(/_/g, " ")}</Badge>
                      </TableCell>
                      <TableCell>
                        {ins.score !== null ? (
                          <span className={`font-bold ${ins.score >= 80 ? "text-success" : ins.score >= 60 ? "text-warning" : "text-destructive"}`}>
                            {ins.score}%
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        {ins.findings > 0 ? (
                          <span className="text-xs">{ins.findings} {ins.critical > 0 && <Badge className="bg-destructive/10 text-destructive ml-1">{ins.critical} critical</Badge>}</span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-xs">{ins.followUp || "—"}</TableCell>
                      <TableCell><Button variant="outline" size="sm" className="h-7 text-xs">View</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enforcement">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Enforcement Actions</CardTitle>
              <CardDescription>Notices, closures, fines, and compliance deadlines</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Violation</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ENFORCEMENT_ACTIONS.map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono text-xs">{e.id}</TableCell>
                      <TableCell className="font-medium">{e.site}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{e.violation}</TableCell>
                      <TableCell>
                        <Badge className={e.severity === "critical" ? "bg-destructive/10 text-destructive" : e.severity === "high" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"}>
                          {e.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>{e.action}</TableCell>
                      <TableCell className="text-xs">{e.issued}</TableCell>
                      <TableCell className="text-xs">{e.deadline}</TableCell>
                      <TableCell>
                        <Badge className={e.status === "complied" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}>
                          {e.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Compliance Overview by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {COMPLIANCE_SUMMARY.map((c, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-sm font-medium w-36">{c.category}</span>
                    <Progress value={c.rate} className="h-3 flex-1" />
                    <span className={`text-sm font-bold w-12 text-right ${c.rate >= 80 ? "text-success" : c.rate >= 60 ? "text-warning" : "text-destructive"}`}>
                      {c.rate}%
                    </span>
                    <span className="text-xs text-muted-foreground w-24">{c.compliant}/{c.total} compliant</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
