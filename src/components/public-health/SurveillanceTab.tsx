import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Radio, AlertTriangle, Plus, Eye, CheckCircle, Clock, FileText, ChevronDown, ChevronUp, Send, UserPlus } from "lucide-react";
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
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [showNewCase, setShowNewCase] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<string | null>(null);

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
                  <Button size="sm" className="gap-1" onClick={() => setShowNewEvent(!showNewEvent)}>
                    <Plus className="h-3.5 w-3.5" /> Report Event
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* New Event Form */}
              {showNewEvent && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-3">Report New Surveillance Event</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Disease / Condition</Label>
                        <Select>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select disease" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cholera">Cholera</SelectItem>
                            <SelectItem value="typhoid">Typhoid</SelectItem>
                            <SelectItem value="measles">Measles</SelectItem>
                            <SelectItem value="malaria">Malaria</SelectItem>
                            <SelectItem value="afp">AFP (Acute Flaccid Paralysis)</SelectItem>
                            <SelectItem value="awd">Acute Watery Diarrhoea</SelectItem>
                            <SelectItem value="anthrax">Anthrax</SelectItem>
                            <SelectItem value="rabies">Rabies</SelectItem>
                            <SelectItem value="other">Other (specify)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label className="text-xs">Reporting Facility</Label><Input placeholder="Search facility..." className="h-8 text-xs" /></div>
                      <div><Label className="text-xs">Number of Cases</Label><Input type="number" defaultValue={1} className="h-8 text-xs" /></div>
                      <div><Label className="text-xs">Date of Detection</Label><Input type="date" defaultValue="2026-04-06" className="h-8 text-xs" /></div>
                      <div><Label className="text-xs">Location / Ward</Label><Input placeholder="e.g. Ward 22, Budiriro" className="h-8 text-xs" /></div>
                      <div>
                        <Label className="text-xs">Source</Label>
                        <Select>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Source" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="facility">Facility Report</SelectItem>
                            <SelectItem value="community">Community Alert</SelectItem>
                            <SelectItem value="lab">Laboratory Notification</SelectItem>
                            <SelectItem value="citizen">Citizen Report</SelectItem>
                            <SelectItem value="media">Media Monitoring</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-3"><Label className="text-xs">Clinical Details / Notes</Label><Textarea placeholder="Describe symptoms, clinical presentation, epidemiological context..." className="text-xs min-h-[60px]" /></div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm">Submit Event</Button>
                      <Button size="sm" variant="outline" onClick={() => setShowNewEvent(false)}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

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
                    <>
                      <TableRow key={sig.id} className={selectedSignal === sig.id ? "bg-primary/5" : ""}>
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
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setSelectedSignal(selectedSignal === sig.id ? null : sig.id)}>
                            {selectedSignal === sig.id ? "Close" : (
                              <>
                                {sig.action === "investigate" && <><Eye className="h-3 w-3" /> Investigate</>}
                                {sig.action === "respond" && <><AlertTriangle className="h-3 w-3" /> Respond</>}
                                {sig.action === "watch" && <><Clock className="h-3 w-3" /> Monitor</>}
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {selectedSignal === sig.id && (
                        <TableRow key={sig.id + "-action"}>
                          <TableCell colSpan={8}>
                            <div className="p-4 bg-muted/30 rounded-lg space-y-4">
                              <h4 className="text-sm font-semibold">Signal Response Workflow — {sig.disease} at {sig.facility}</h4>
                              
                              {/* Step 1: Verification */}
                              <div className="p-3 border rounded-lg space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">Step 1</Badge>
                                  <span className="text-sm font-medium">Signal Verification</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <Label className="text-xs">Verification Status</Label>
                                    <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="confirmed">Confirmed — True Signal</SelectItem>
                                        <SelectItem value="false_alarm">False Alarm — Data Error</SelectItem>
                                        <SelectItem value="duplicate">Duplicate of Existing</SelectItem>
                                        <SelectItem value="needs_more_info">Needs More Information</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div><Label className="text-xs">Verified By</Label><Input placeholder="Officer name" className="h-8 text-xs" /></div>
                                  <div><Label className="text-xs">Verification Date</Label><Input type="date" className="h-8 text-xs" /></div>
                                </div>
                              </div>

                              {/* Step 2: Risk Assessment */}
                              <div className="p-3 border rounded-lg space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">Step 2</Badge>
                                  <span className="text-sm font-medium">Risk Assessment</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <Label className="text-xs">Risk Level</Label>
                                    <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Assess risk" /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="low">Low — Monitor Only</SelectItem>
                                        <SelectItem value="moderate">Moderate — Enhanced Surveillance</SelectItem>
                                        <SelectItem value="high">High — Field Investigation Required</SelectItem>
                                        <SelectItem value="critical">Critical — Immediate Response</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label className="text-xs">Spread Potential</Label>
                                    <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="contained">Contained</SelectItem>
                                        <SelectItem value="local">Local Spread Likely</SelectItem>
                                        <SelectItem value="regional">Regional Spread Risk</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div><Label className="text-xs">Population at Risk</Label><Input placeholder="Estimated number" className="h-8 text-xs" /></div>
                                </div>
                              </div>

                              {/* Step 3: Response Actions */}
                              <div className="p-3 border rounded-lg space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">Step 3</Badge>
                                  <span className="text-sm font-medium">Response Actions</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-xs">Response Actions (select all applicable)</Label>
                                    <div className="space-y-1 mt-1">
                                      {["Deploy field investigation team", "Initiate contact tracing", "Collect laboratory specimens", "Issue public health alert", "Activate EOC", "Request WHO support", "Begin case management protocol"].map((action, i) => (
                                        <label key={i} className="flex items-center gap-2 text-xs">
                                          <input type="checkbox" className="rounded" />
                                          {action}
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <div><Label className="text-xs">Assign To Team</Label>
                                      <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select team" /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="ft01">FT-01 Harare South Response</SelectItem>
                                          <SelectItem value="ft02">FT-02 Chitungwiza Investigation</SelectItem>
                                          <SelectItem value="ft03">FT-03 Manicaland Vector Control</SelectItem>
                                          <SelectItem value="new">Create New Team</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div><Label className="text-xs">Escalation Level</Label>
                                      <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="district">District Level</SelectItem>
                                          <SelectItem value="provincial">Provincial Level</SelectItem>
                                          <SelectItem value="national">National Level</SelectItem>
                                          <SelectItem value="international">International (IHR)</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div><Label className="text-xs">Notes</Label><Textarea placeholder="Additional instructions..." className="text-xs min-h-[60px]" /></div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button size="sm">Save & Initiate Response</Button>
                                <Button size="sm" variant="outline">Save as Draft</Button>
                                <Button size="sm" variant="outline">Link to Outbreak</Button>
                                <Button size="sm" variant="outline" onClick={() => setSelectedSignal(null)}>Cancel</Button>
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

        <TabsContent value="cases">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Case-Based Surveillance Reports</CardTitle>
                  <CardDescription>Individual case investigations for notifiable diseases</CardDescription>
                </div>
                <Button size="sm" className="gap-1" onClick={() => setShowNewCase(!showNewCase)}>
                  <Plus className="h-3.5 w-3.5" /> New Case Report
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showNewCase && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-3">New Case-Based Report (CBR)</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Disease</Label>
                        <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cholera">Cholera</SelectItem>
                            <SelectItem value="typhoid">Typhoid</SelectItem>
                            <SelectItem value="measles">Measles</SelectItem>
                            <SelectItem value="afp">AFP</SelectItem>
                            <SelectItem value="neonatal_tetanus">Neonatal Tetanus</SelectItem>
                            <SelectItem value="meningitis">Meningitis</SelectItem>
                            <SelectItem value="yellow_fever">Yellow Fever</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label className="text-xs">Patient (CPID)</Label><Input placeholder="Search or enter CPID" className="h-8 text-xs" /></div>
                      <div><Label className="text-xs">Age</Label><Input type="number" className="h-8 text-xs" /></div>
                      <div>
                        <Label className="text-xs">Sex</Label>
                        <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="M">Male</SelectItem>
                            <SelectItem value="F">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label className="text-xs">Reporting Facility</Label><Input placeholder="Search facility" className="h-8 text-xs" /></div>
                      <div><Label className="text-xs">Date of Onset</Label><Input type="date" className="h-8 text-xs" /></div>
                      <div><Label className="text-xs">Date of Notification</Label><Input type="date" defaultValue="2026-04-06" className="h-8 text-xs" /></div>
                      <div>
                        <Label className="text-xs">Initial Classification</Label>
                        <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="suspected">Suspected</SelectItem>
                            <SelectItem value="probable">Probable</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Outcome</Label>
                        <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admitted">Admitted</SelectItem>
                            <SelectItem value="outpatient">Outpatient</SelectItem>
                            <SelectItem value="recovering">Recovering</SelectItem>
                            <SelectItem value="deceased">Deceased</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-3"><Label className="text-xs">Clinical Summary</Label><Textarea placeholder="Symptoms, signs, treatment given..." className="text-xs min-h-[60px]" /></div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm">Submit CBR</Button>
                      <Button size="sm" variant="outline" onClick={() => setShowNewCase(false)}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

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
                    <>
                      <TableRow key={c.id} className={selectedCase === c.id ? "bg-primary/5" : ""}>
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
                        <TableCell>
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setSelectedCase(selectedCase === c.id ? null : c.id)}>
                            {selectedCase === c.id ? "Close" : "Update"}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {selectedCase === c.id && (
                        <TableRow key={c.id + "-update"}>
                          <TableCell colSpan={9}>
                            <div className="p-3 bg-muted/30 rounded-lg space-y-3">
                              <h4 className="text-sm font-semibold">Case Update — {c.id}</h4>
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <Label className="text-xs">Update Classification</Label>
                                  <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder={c.status} /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="suspected">Suspected</SelectItem>
                                      <SelectItem value="probable">Probable</SelectItem>
                                      <SelectItem value="confirmed">Confirmed</SelectItem>
                                      <SelectItem value="discarded">Discarded</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-xs">Update Outcome</Label>
                                  <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder={c.outcome} /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="admitted">Admitted</SelectItem>
                                      <SelectItem value="recovering">Recovering</SelectItem>
                                      <SelectItem value="discharged">Discharged</SelectItem>
                                      <SelectItem value="deceased">Deceased</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-xs">Lab Result</Label>
                                  <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="positive">Positive</SelectItem>
                                      <SelectItem value="negative">Negative</SelectItem>
                                      <SelectItem value="inconclusive">Inconclusive</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div><Label className="text-xs">Investigation Notes</Label><Textarea placeholder="Progress notes..." className="text-xs min-h-[40px]" /></div>
                              <div className="flex gap-2">
                                <Button size="sm">Save Update</Button>
                                <Button size="sm" variant="outline">Link Contacts</Button>
                                <Button size="sm" variant="outline">Generate Line List</Button>
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

        <TabsContent value="weekly">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Weekly IDSR Aggregate Reporting</CardTitle>
                  <CardDescription>Facility reporting completeness and timeliness for current epidemiological week</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">Week 14, 2026</Badge>
                  <Button size="sm" variant="outline" className="gap-1"><Send className="h-3.5 w-3.5" /> Bulk Reminder</Button>
                </div>
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
                        <div className="flex gap-1">
                          {!r.submitted && <Button variant="outline" size="sm" className="h-7 text-xs">Send Reminder</Button>}
                          {r.submitted && <Button variant="ghost" size="sm" className="h-7 text-xs">View Report</Button>}
                        </div>
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