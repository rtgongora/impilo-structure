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
import { Siren, Users, Plus, BarChart3, MapPin, UserCheck } from "lucide-react";
import { useState } from "react";

const OUTBREAKS = [
  { id: "OB-2026-001", disease: "Cholera", location: "Budiriro, Harare", status: "active", cases: 47, deaths: 2, cfr: "4.3%", started: "2026-02-15", lastUpdate: "2 hrs ago", severity: "high", responseTeams: 3, contactsTraced: 156 },
  { id: "OB-2026-002", disease: "Typhoid", location: "Chitungwiza", status: "active", cases: 23, deaths: 0, cfr: "0%", started: "2026-02-28", lastUpdate: "4 hrs ago", severity: "medium", responseTeams: 1, contactsTraced: 45 },
  { id: "OB-2026-003", disease: "Measles", location: "Masvingo Province", status: "contained", cases: 156, deaths: 3, cfr: "1.9%", started: "2025-12-10", lastUpdate: "1 day ago", severity: "medium", responseTeams: 2, contactsTraced: 890 },
];

const EPI_CURVE_DATA = [
  { week: "W6", cases: 2 }, { week: "W7", cases: 5 }, { week: "W8", cases: 8 }, { week: "W9", cases: 12 },
  { week: "W10", cases: 7 }, { week: "W11", cases: 5 }, { week: "W12", cases: 4 }, { week: "W13", cases: 3 }, { week: "W14", cases: 1 },
];

const CONTACT_QUEUE = [
  { id: "CT-001", contact: "M. Banda", index: "CPID-***421", relation: "Household", status: "under_monitoring", day: "Day 4/5", symptoms: false },
  { id: "CT-002", contact: "S. Moyo", index: "CPID-***421", relation: "Neighbour", status: "under_monitoring", day: "Day 4/5", symptoms: false },
  { id: "CT-003", contact: "T. Ncube", index: "CPID-***422", relation: "Household", status: "symptomatic", day: "Day 3/5", symptoms: true },
  { id: "CT-004", contact: "R. Zhou", index: "CPID-***422", relation: "School", status: "completed", day: "Day 5/5", symptoms: false },
  { id: "CT-005", contact: "L. Dube", index: "CPID-***423", relation: "Household", status: "lost_to_followup", day: "Day 2/5", symptoms: false },
];

export function EnhancedOutbreaksTab() {
  const [selectedOutbreak, setSelectedOutbreak] = useState<string | null>(null);
  const [showDeclareForm, setShowDeclareForm] = useState(false);
  const [showNewContact, setShowNewContact] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Siren className="h-5 w-5" /> Outbreak & Incident Operations</CardTitle>
              <CardDescription>Full lifecycle management — detection, response, containment, closure</CardDescription>
            </div>
            <Button className="gap-1" onClick={() => setShowDeclareForm(!showDeclareForm)}>
              <Plus className="h-4 w-4" /> Declare Outbreak
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Declare Outbreak Form */}
          {showDeclareForm && (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-3 text-destructive">Declare New Outbreak / Health Incident</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Disease / Condition</Label>
                    <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cholera">Cholera</SelectItem>
                        <SelectItem value="typhoid">Typhoid</SelectItem>
                        <SelectItem value="measles">Measles</SelectItem>
                        <SelectItem value="anthrax">Anthrax</SelectItem>
                        <SelectItem value="food_poisoning">Food Poisoning</SelectItem>
                        <SelectItem value="chemical">Chemical Incident</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Location / Area</Label><Input placeholder="e.g. Budiriro, Harare" className="h-8 text-xs" /></div>
                  <div>
                    <Label className="text-xs">Severity</Label>
                    <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Assess" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Initial Case Count</Label><Input type="number" className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Initial Deaths</Label><Input type="number" defaultValue={0} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Date of First Case</Label><Input type="date" className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Reporting Officer</Label><Input placeholder="Name and designation" className="h-8 text-xs" /></div>
                  <div>
                    <Label className="text-xs">EOC Activation</Label>
                    <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select level" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No EOC Activation</SelectItem>
                        <SelectItem value="level1">Level 1 — Watch</SelectItem>
                        <SelectItem value="level2">Level 2 — Enhanced Response</SelectItem>
                        <SelectItem value="level3">Level 3 — Full Activation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Response Teams to Deploy</Label><Input type="number" defaultValue={1} className="h-8 text-xs" /></div>
                </div>
                <div className="mt-3"><Label className="text-xs">Situation Summary</Label><Textarea placeholder="Describe the outbreak situation, affected population, initial response..." className="text-xs min-h-[80px]" /></div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="destructive">Declare Outbreak</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowDeclareForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Disease</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cases</TableHead>
                <TableHead>Deaths</TableHead>
                <TableHead>CFR</TableHead>
                <TableHead>Teams</TableHead>
                <TableHead>Contacts</TableHead>
                <TableHead>Started</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {OUTBREAKS.map(ob => (
                <TableRow key={ob.id} className={selectedOutbreak === ob.id ? "bg-primary/5" : ""}>
                  <TableCell className="font-mono text-xs">{ob.id}</TableCell>
                  <TableCell className="font-medium">{ob.disease}</TableCell>
                  <TableCell className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ob.location}</TableCell>
                  <TableCell>
                    <Badge className={ob.status === "active" ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}>
                      {ob.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold">{ob.cases}</TableCell>
                  <TableCell>{ob.deaths}</TableCell>
                  <TableCell className={parseFloat(ob.cfr) > 2 ? "text-destructive font-bold" : ""}>{ob.cfr}</TableCell>
                  <TableCell>{ob.responseTeams}</TableCell>
                  <TableCell>{ob.contactsTraced}</TableCell>
                  <TableCell className="text-xs">{ob.started}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setSelectedOutbreak(ob.id === selectedOutbreak ? null : ob.id)}>
                      {ob.id === selectedOutbreak ? "Close" : "Detail"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedOutbreak && (
        <>
          {/* Outbreak Update Form */}
          <Card className="border-warning/20 bg-warning/5">
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-3">Update Outbreak — {OUTBREAKS.find(o => o.id === selectedOutbreak)?.disease}</h4>
              <div className="grid grid-cols-4 gap-3">
                <div><Label className="text-xs">New Cases (today)</Label><Input type="number" defaultValue={0} className="h-8 text-xs" /></div>
                <div><Label className="text-xs">New Deaths (today)</Label><Input type="number" defaultValue={0} className="h-8 text-xs" /></div>
                <div><Label className="text-xs">New Contacts Traced</Label><Input type="number" defaultValue={0} className="h-8 text-xs" /></div>
                <div>
                  <Label className="text-xs">Status Update</Label>
                  <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Current status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active — Ongoing</SelectItem>
                      <SelectItem value="declining">Active — Declining</SelectItem>
                      <SelectItem value="contained">Contained</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-2"><Label className="text-xs">Situation Update Notes</Label><Textarea placeholder="Today's situation update..." className="text-xs min-h-[40px]" /></div>
              <div className="flex gap-2 mt-2">
                <Button size="sm">Submit Daily Update</Button>
                <Button size="sm" variant="outline">Generate SitRep</Button>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="epi" className="space-y-3">
            <TabsList>
              <TabsTrigger value="epi">Epi Curve</TabsTrigger>
              <TabsTrigger value="contacts">Contact Tracing</TabsTrigger>
              <TabsTrigger value="response">Response Teams</TabsTrigger>
            </TabsList>

            <TabsContent value="epi">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Epidemiological Curve</CardTitle>
                  <CardDescription>Weekly case distribution — {OUTBREAKS.find(o => o.id === selectedOutbreak)?.disease}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2 h-32">
                    {EPI_CURVE_DATA.map((d, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-destructive/70 rounded-t" style={{ height: `${(d.cases / 12) * 100}%`, minHeight: d.cases > 0 ? 4 : 0 }} />
                        <span className="text-[9px] text-muted-foreground">{d.week}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">Cases by epidemiological week</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contacts">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2"><UserCheck className="h-4 w-4" /> Contact Tracing Queue</CardTitle>
                    <Button size="sm" className="gap-1" onClick={() => setShowNewContact(!showNewContact)}>
                      <Plus className="h-3.5 w-3.5" /> Log Contact
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {showNewContact && (
                    <Card className="border-primary/20 bg-primary/5">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-sm mb-3">Log New Contact</h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div><Label className="text-xs">Contact Name</Label><Input placeholder="Full name" className="h-8 text-xs" /></div>
                          <div><Label className="text-xs">Index Case (CPID)</Label><Input placeholder="CPID of source case" className="h-8 text-xs" /></div>
                          <div>
                            <Label className="text-xs">Relationship</Label>
                            <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="household">Household</SelectItem>
                                <SelectItem value="neighbour">Neighbour</SelectItem>
                                <SelectItem value="workplace">Workplace</SelectItem>
                                <SelectItem value="school">School</SelectItem>
                                <SelectItem value="healthcare">Healthcare Worker</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div><Label className="text-xs">Phone Number</Label><Input placeholder="+263..." className="h-8 text-xs" /></div>
                          <div><Label className="text-xs">Address</Label><Input placeholder="Location" className="h-8 text-xs" /></div>
                          <div><Label className="text-xs">Monitoring Duration (days)</Label><Input type="number" defaultValue={5} className="h-8 text-xs" /></div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm">Register Contact</Button>
                          <Button size="sm" variant="outline" onClick={() => setShowNewContact(false)}>Cancel</Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Contact Name</TableHead>
                        <TableHead>Index Case</TableHead>
                        <TableHead>Relation</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Monitoring</TableHead>
                        <TableHead>Symptomatic</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {CONTACT_QUEUE.map(c => (
                        <>
                          <TableRow key={c.id} className={selectedContact === c.id ? "bg-primary/5" : ""}>
                            <TableCell className="font-mono text-xs">{c.id}</TableCell>
                            <TableCell className="font-medium">{c.contact}</TableCell>
                            <TableCell className="font-mono text-xs">{c.index}</TableCell>
                            <TableCell>{c.relation}</TableCell>
                            <TableCell>
                              <Badge className={
                                c.status === "symptomatic" ? "bg-destructive/10 text-destructive" :
                                c.status === "lost_to_followup" ? "bg-warning/10 text-warning" :
                                c.status === "completed" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                              }>{c.status.replace(/_/g, " ")}</Badge>
                            </TableCell>
                            <TableCell className="text-xs">{c.day}</TableCell>
                            <TableCell>
                              {c.symptoms ? <Badge className="bg-destructive/10 text-destructive">Yes</Badge> : <span className="text-xs text-muted-foreground">No</span>}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedContact(selectedContact === c.id ? null : c.id)}>
                                {selectedContact === c.id ? "Close" : "Update"}
                              </Button>
                            </TableCell>
                          </TableRow>
                          {selectedContact === c.id && (
                            <TableRow key={c.id + "-update"}>
                              <TableCell colSpan={8}>
                                <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                                  <h4 className="text-sm font-semibold">Daily Follow-up — {c.contact}</h4>
                                  <div className="grid grid-cols-3 gap-3">
                                    <div>
                                      <Label className="text-xs">Today's Check</Label>
                                      <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Result" /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="well">Well — No Symptoms</SelectItem>
                                          <SelectItem value="symptomatic">Symptomatic — Refer for Testing</SelectItem>
                                          <SelectItem value="unreachable">Could Not Reach</SelectItem>
                                          <SelectItem value="refused">Refused Follow-up</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div><Label className="text-xs">Temperature (°C)</Label><Input placeholder="e.g. 36.8" className="h-8 text-xs" /></div>
                                    <div><Label className="text-xs">Notes</Label><Textarea placeholder="Observations..." className="h-8 text-xs min-h-[32px]" /></div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm">Save Check-in</Button>
                                    <Button size="sm" variant="outline">Convert to Case</Button>
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

            <TabsContent value="response">
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { name: "Harare South Response Team", lead: "J. Moyo", members: 6, tasks: "Contact tracing, water sampling", since: "Apr 2" },
                      { name: "WASH Emergency Team", lead: "T. Matamba", members: 4, tasks: "Water purification, hygiene promotion", since: "Apr 3" },
                      { name: "CTC Clinical Team", lead: "Dr. S. Hwende", members: 8, tasks: "Patient management, case management", since: "Apr 3" },
                    ].map((t, i) => (
                      <Card key={i}>
                        <CardContent className="p-3">
                          <h4 className="font-semibold text-sm mb-2">{t.name}</h4>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <p>Lead: <span className="text-foreground">{t.lead}</span></p>
                            <p>Members: <span className="text-foreground">{t.members}</span></p>
                            <p>Tasks: <span className="text-foreground">{t.tasks}</span></p>
                            <p>Deployed: <span className="text-foreground">{t.since}</span></p>
                          </div>
                          <Button variant="outline" size="sm" className="h-7 text-xs mt-2 w-full">Update Team Status</Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}