import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardCheck, Plus, Calendar, AlertTriangle, CheckCircle, Star, FileText } from "lucide-react";
import { useState } from "react";

const INSPECTIONS = [
  { id: "INS-001", site: "Mbare Musika Market", siteType: "Market", type: "Routine Food Safety", inspector: "J. Moyo", date: "2026-04-08", status: "completed", score: 72, findings: 3, critical: 0, followUp: "2026-05-08" },
  { id: "INS-002", site: "Eastlea Swimming Pool", siteType: "Recreation", type: "Water Quality", inspector: "T. Ndlovu", date: "2026-04-09", status: "scheduled", score: null, findings: 0, critical: 0, followUp: null },
  { id: "INS-003", site: "Southerton Abattoir", siteType: "Abattoir", type: "Meat Safety", inspector: "P. Chirwa", date: "2026-04-07", status: "completed", score: 45, findings: 7, critical: 2, followUp: "2026-04-14" },
  { id: "INS-004", site: "Corner Bakery - Avondale", siteType: "Food Premises", type: "Food Premises", inspector: "S. Makoni", date: "2026-04-10", status: "in_progress", score: null, findings: 1, critical: 0, followUp: null },
  { id: "INS-005", site: "Glen Norah Borehole #3", siteType: "Water Point", type: "Water Source", inspector: "R. Dube", date: "2026-04-06", status: "completed", score: 88, findings: 1, critical: 0, followUp: null },
];

const ENFORCEMENT_ACTIONS = [
  { id: "ENF-001", site: "Southerton Abattoir", violation: "Unsanitary slaughter conditions", severity: "critical", action: "Closure Notice", issued: "2026-04-07", deadline: "2026-04-14", status: "pending_compliance" },
  { id: "ENF-002", site: "Happy Foods Takeaway", violation: "Expired food storage", severity: "high", action: "Improvement Notice", issued: "2026-03-28", deadline: "2026-04-11", status: "complied" },
];

export function EnhancedInspectionsTab() {
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<string | null>(null);
  const [showEnforcementForm, setShowEnforcementForm] = useState(false);

  return (
    <div className="space-y-4">
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
                <Button size="sm" className="gap-1" onClick={() => setShowScheduleForm(!showScheduleForm)}>
                  <Plus className="h-3.5 w-3.5" /> Schedule Inspection
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showScheduleForm && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-3">Schedule New Inspection</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div><Label className="text-xs">Site / Premises</Label><Input placeholder="Search site (INDAWO)..." className="h-8 text-xs" /></div>
                      <div>
                        <Label className="text-xs">Site Type</Label>
                        <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="food">Food Premises</SelectItem>
                            <SelectItem value="market">Market</SelectItem>
                            <SelectItem value="abattoir">Abattoir</SelectItem>
                            <SelectItem value="water">Water Point</SelectItem>
                            <SelectItem value="pool">Swimming Pool</SelectItem>
                            <SelectItem value="school">School</SelectItem>
                            <SelectItem value="public">Public Facility</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Inspection Type</Label>
                        <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="routine">Routine</SelectItem>
                            <SelectItem value="adhoc">Ad-hoc / Complaint-driven</SelectItem>
                            <SelectItem value="followup">Follow-up</SelectItem>
                            <SelectItem value="licensing">Licensing Assessment</SelectItem>
                            <SelectItem value="outbreak">Outbreak Investigation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label className="text-xs">Scheduled Date</Label><Input type="date" className="h-8 text-xs" /></div>
                      <div><Label className="text-xs">Assigned Inspector</Label>
                        <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="jmoyo">J. Moyo</SelectItem>
                            <SelectItem value="tndlovu">T. Ndlovu</SelectItem>
                            <SelectItem value="pchirwa">P. Chirwa</SelectItem>
                            <SelectItem value="smakoni">S. Makoni</SelectItem>
                            <SelectItem value="rdube">R. Dube</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label className="text-xs">Notes</Label><Textarea placeholder="Specific areas to inspect..." className="text-xs min-h-[32px]" /></div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm">Schedule</Button>
                      <Button size="sm" variant="outline" onClick={() => setShowScheduleForm(false)}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Inspector</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Findings</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {INSPECTIONS.map(ins => (
                    <>
                      <TableRow key={ins.id} className={selectedInspection === ins.id ? "bg-primary/5" : ""}>
                        <TableCell className="font-mono text-xs">{ins.id}</TableCell>
                        <TableCell className="font-medium">{ins.site}</TableCell>
                        <TableCell className="text-xs">{ins.type}</TableCell>
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
                            <span className={`font-bold ${ins.score >= 80 ? "text-success" : ins.score >= 60 ? "text-warning" : "text-destructive"}`}>{ins.score}%</span>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          {ins.findings > 0 ? <span className="text-xs">{ins.findings} {ins.critical > 0 && <Badge className="bg-destructive/10 text-destructive ml-1">{ins.critical} critical</Badge>}</span> : "—"}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setSelectedInspection(selectedInspection === ins.id ? null : ins.id)}>
                            {selectedInspection === ins.id ? "Close" : ins.status === "scheduled" ? "Start" : ins.status === "in_progress" ? "Continue" : "Review"}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {selectedInspection === ins.id && (
                        <TableRow key={ins.id + "-form"}>
                          <TableCell colSpan={9}>
                            <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                              <h4 className="text-sm font-semibold">Inspection Form — {ins.site}</h4>
                              
                              {/* Checklist */}
                              <div className="p-3 border rounded-lg space-y-2">
                                <span className="text-sm font-medium">Inspection Checklist</span>
                                {["General cleanliness and hygiene", "Food storage temperatures", "Pest control measures", "Staff hygiene practices", "Waste disposal systems", "Water supply quality", "Sanitary facilities", "Documentation & licenses"].map((item, i) => (
                                  <label key={i} className="flex items-center gap-2 text-xs">
                                    <input type="checkbox" className="rounded" />
                                    <span className="flex-1">{item}</span>
                                    <Select><SelectTrigger className="h-7 w-[100px] text-xs"><SelectValue placeholder="Score" /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="compliant">Compliant</SelectItem>
                                        <SelectItem value="minor">Minor Issue</SelectItem>
                                        <SelectItem value="major">Major Issue</SelectItem>
                                        <SelectItem value="critical">Critical</SelectItem>
                                        <SelectItem value="na">N/A</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </label>
                                ))}
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div><Label className="text-xs">Overall Compliance Score (%)</Label><Input type="number" min={0} max={100} className="h-8 text-xs" /></div>
                                <div>
                                  <Label className="text-xs">Recommended Action</Label>
                                  <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pass">Pass — No Action</SelectItem>
                                      <SelectItem value="warning">Warning Letter</SelectItem>
                                      <SelectItem value="improvement">Improvement Notice</SelectItem>
                                      <SelectItem value="closure">Closure Notice</SelectItem>
                                      <SelectItem value="prosecution">Recommend Prosecution</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div><Label className="text-xs">Findings & Observations</Label><Textarea placeholder="Detailed findings..." className="text-xs min-h-[60px]" /></div>
                              <div className="flex gap-2">
                                <Button size="sm">Complete Inspection</Button>
                                <Button size="sm" variant="outline">Save Draft</Button>
                                <Button size="sm" variant="outline">Schedule Follow-up</Button>
                                <Button size="sm" variant="outline">Issue Enforcement</Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enforcement">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Enforcement Actions</CardTitle>
                <Button size="sm" className="gap-1" onClick={() => setShowEnforcementForm(!showEnforcementForm)}>
                  <Plus className="h-3.5 w-3.5" /> Issue Notice
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showEnforcementForm && (
                <Card className="border-destructive/20 bg-destructive/5">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-3">Issue Enforcement Notice</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div><Label className="text-xs">Site / Premises</Label><Input placeholder="Search site..." className="h-8 text-xs" /></div>
                      <div>
                        <Label className="text-xs">Notice Type</Label>
                        <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="warning">Warning Letter</SelectItem>
                            <SelectItem value="improvement">Improvement Notice</SelectItem>
                            <SelectItem value="prohibition">Prohibition Notice</SelectItem>
                            <SelectItem value="closure">Closure Notice</SelectItem>
                            <SelectItem value="fine">Fixed Penalty / Fine</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label className="text-xs">Compliance Deadline</Label><Input type="date" className="h-8 text-xs" /></div>
                      <div className="col-span-2"><Label className="text-xs">Violation Description</Label><Textarea placeholder="Describe the violation..." className="text-xs min-h-[40px]" /></div>
                      <div><Label className="text-xs">Fine Amount (if applicable)</Label><Input placeholder="$0.00" className="h-8 text-xs" /></div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="destructive">Issue Notice</Button>
                      <Button size="sm" variant="outline" onClick={() => setShowEnforcementForm(false)}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Violation</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ENFORCEMENT_ACTIONS.map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono text-xs">{e.id}</TableCell>
                      <TableCell className="font-medium">{e.site}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs">{e.violation}</TableCell>
                      <TableCell>
                        <Badge className={e.severity === "critical" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}>{e.severity}</Badge>
                      </TableCell>
                      <TableCell>{e.action}</TableCell>
                      <TableCell className="text-xs">{e.deadline}</TableCell>
                      <TableCell>
                        <Badge className={e.status === "complied" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}>
                          {e.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" className="h-7 text-xs">Mark Complied</Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs">Escalate</Button>
                        </div>
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
                {[
                  { category: "Food Premises", total: 342, compliant: 289, rate: 84 },
                  { category: "Water Points", total: 156, compliant: 142, rate: 91 },
                  { category: "Markets", total: 28, compliant: 19, rate: 68 },
                  { category: "Abattoirs", total: 12, compliant: 8, rate: 67 },
                  { category: "Schools", total: 89, compliant: 78, rate: 88 },
                  { category: "Public Facilities", total: 45, compliant: 38, rate: 84 },
                ].map((c, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-sm font-medium w-36">{c.category}</span>
                    <Progress value={c.rate} className="h-3 flex-1" />
                    <span className={`text-sm font-bold w-12 text-right ${c.rate >= 80 ? "text-success" : c.rate >= 60 ? "text-warning" : "text-destructive"}`}>{c.rate}%</span>
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