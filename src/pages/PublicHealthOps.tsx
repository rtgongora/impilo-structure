import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Activity, AlertTriangle, Bug, ClipboardCheck, Globe, Megaphone, MapPin,
  Shield, Siren, Users, Eye, Phone, FileText, BarChart3, Settings,
  Building, TreePine, Ship, School, Droplets, Search, Filter, Plus,
  TrendingUp, Calendar, Radio, Zap, Target
} from "lucide-react";
import { useState } from "react";

// Jurisdiction Packs
const JURISDICTION_PACKS = [
  { id: "city_health", label: "City Health Pack", description: "Urban municipal public health operations", icon: Building, color: "bg-blue-500", activeIn: "Harare, Bulawayo, Mutare, Gweru, Kwekwe, Masvingo" },
  { id: "rdc_health", label: "Rural District Council Health Pack", description: "Rural public health operations and community health", icon: TreePine, color: "bg-green-500", activeIn: "62 Rural District Councils" },
  { id: "provincial", label: "Provincial Public Health Oversight Pack", description: "Provincial surveillance, coordination, and oversight", icon: Globe, color: "bg-purple-500", activeIn: "All 10 Provinces" },
  { id: "national", label: "National Public Health Oversight Pack", description: "National surveillance, policy, and coordination", icon: Shield, color: "bg-red-500", activeIn: "National" },
  { id: "port_health", label: "Port Health Pack", description: "Border and port of entry health operations", icon: Ship, color: "bg-indigo-500", activeIn: "14 Ports of Entry" },
  { id: "school_health", label: "School Health Pack", description: "School-based health services and inspections", icon: School, color: "bg-amber-500", activeIn: "1,284 Schools" },
];

const SAMPLE_OUTBREAKS = [
  { id: "OB-2026-001", disease: "Cholera", location: "Budiriro, Harare", status: "active", cases: 47, deaths: 2, started: "2026-02-15", lastUpdate: "2 hrs ago", severity: "high" },
  { id: "OB-2026-002", disease: "Typhoid", location: "Chitungwiza", status: "active", cases: 23, deaths: 0, started: "2026-02-28", lastUpdate: "4 hrs ago", severity: "medium" },
  { id: "OB-2026-003", disease: "Measles", location: "Masvingo Province", status: "contained", cases: 156, deaths: 3, started: "2025-12-10", lastUpdate: "1 day ago", severity: "medium" },
];

const SAMPLE_INSPECTIONS = [
  { id: "INS-001", site: "Mbare Musika Market", type: "Routine Food Safety", inspector: "J. Moyo", date: "2026-03-08", status: "completed", findings: 3, critical: 0 },
  { id: "INS-002", site: "Eastlea Swimming Pool", type: "Water Quality", inspector: "T. Ndlovu", date: "2026-03-09", status: "scheduled", findings: 0, critical: 0 },
  { id: "INS-003", site: "Southerton Abattoir", type: "Meat Safety", inspector: "P. Chirwa", date: "2026-03-07", status: "completed", findings: 7, critical: 2 },
  { id: "INS-004", site: "Corner Bakery - Avondale", type: "Food Premises", inspector: "S. Makoni", date: "2026-03-10", status: "in_progress", findings: 1, critical: 0 },
];

const SAMPLE_COMPLAINTS = [
  { id: "CMP-001", type: "Noise Nuisance", location: "Borrowdale", status: "investigating", reported: "2026-03-08", reporter: "Citizen", priority: "medium" },
  { id: "CMP-002", type: "Illegal Dumping", location: "Highfield", status: "enforcement_pending", reported: "2026-03-05", reporter: "Ward Councillor", priority: "high" },
  { id: "CMP-003", type: "Expired Food Products", location: "CBD Shop", status: "resolved", reported: "2026-03-01", reporter: "Anonymous", priority: "high" },
  { id: "CMP-004", type: "Water Contamination", location: "Glen Norah Borehole", status: "investigating", reported: "2026-03-09", reporter: "Community Leader", priority: "critical" },
];

const SAMPLE_CAMPAIGNS = [
  { id: "CAM-001", name: "COVID-19 Booster Rollout", type: "Immunization", status: "active", target: 500000, reached: 234567, startDate: "2026-01-15", jurisdiction: "National" },
  { id: "CAM-002", name: "School Deworming Programme", type: "NTD", status: "active", target: 120000, reached: 98000, startDate: "2026-02-01", jurisdiction: "Provincial - Mashonaland East" },
  { id: "CAM-003", name: "Malaria IRS - Round 2", type: "Vector Control", status: "planning", target: 300000, reached: 0, startDate: "2026-04-01", jurisdiction: "Provincial - Manicaland" },
];

export default function PublicHealthOps() {
  const [activePack, setActivePack] = useState("city_health");

  return (
    <AppLayout title="Public Health & Local Authority Operations">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              Public Health & Local Authority Operations
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Shared reusable capability configured for different jurisdictions — not cloned apps
            </p>
          </div>
        </div>

        {/* Jurisdiction Pack Selector */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Active Jurisdiction Pack
            </CardTitle>
            <CardDescription>Same platform capabilities, configured per jurisdiction</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {JURISDICTION_PACKS.map(pack => (
                <button
                  key={pack.id}
                  onClick={() => setActivePack(pack.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    activePack === pack.id ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-6 h-6 rounded ${pack.color} flex items-center justify-center`}>
                      <pack.icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-xs font-medium">{pack.label}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{pack.activeIn}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-4">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex w-max">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="surveillance">Surveillance / eIDSR</TabsTrigger>
              <TabsTrigger value="outbreaks">Outbreaks & Incidents</TabsTrigger>
              <TabsTrigger value="inspections">Inspections</TabsTrigger>
              <TabsTrigger value="complaints">Complaints & Alerts</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns & Outreach</TabsTrigger>
              <TabsTrigger value="field">Field Operations</TabsTrigger>
              <TabsTrigger value="emergency">Emergency Coordination</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <Card><CardContent className="p-4 text-center">
                <Bug className="h-6 w-6 text-red-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">3</p>
                <p className="text-xs text-muted-foreground">Active Outbreaks</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <ClipboardCheck className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">142</p>
                <p className="text-xs text-muted-foreground">Inspections This Month</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">18</p>
                <p className="text-xs text-muted-foreground">Open Complaints</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <Megaphone className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">5</p>
                <p className="text-xs text-muted-foreground">Active Campaigns</p>
              </CardContent></Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Active Outbreaks</CardTitle></CardHeader>
                <CardContent>
                  {SAMPLE_OUTBREAKS.filter(o => o.status === "active").map(ob => (
                    <div key={ob.id} className="flex items-center justify-between p-2 border rounded mb-2">
                      <div>
                        <p className="font-medium text-sm">{ob.disease} — {ob.location}</p>
                        <p className="text-xs text-muted-foreground">{ob.cases} cases, {ob.deaths} deaths</p>
                      </div>
                      <Badge className={ob.severity === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}>
                        {ob.severity}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Recent Complaints</CardTitle></CardHeader>
                <CardContent>
                  {SAMPLE_COMPLAINTS.slice(0, 3).map(c => (
                    <div key={c.id} className="flex items-center justify-between p-2 border rounded mb-2">
                      <div>
                        <p className="font-medium text-sm">{c.type}</p>
                        <p className="text-xs text-muted-foreground">{c.location} • {c.reported}</p>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">{c.status.replace(/_/g, " ")}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="surveillance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="h-5 w-5" />
                  Electronic Integrated Disease Surveillance & Response (eIDSR)
                </CardTitle>
                <CardDescription>Real-time disease surveillance signals and alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-500">12</p>
                    <p className="text-xs text-muted-foreground">Alerts This Week</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold text-amber-500">7</p>
                    <p className="text-xs text-muted-foreground">Under Investigation</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-500">89%</p>
                    <p className="text-xs text-muted-foreground">Reporting Completeness</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center py-8">
                  Surveillance event streams, threshold alerts, and case-based reporting interface
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="outbreaks">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Siren className="h-5 w-5" />
                  Outbreak & Incident Operations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Disease</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cases</TableHead>
                      <TableHead>Deaths</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Last Update</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SAMPLE_OUTBREAKS.map(ob => (
                      <TableRow key={ob.id}>
                        <TableCell className="font-mono text-xs">{ob.id}</TableCell>
                        <TableCell className="font-medium">{ob.disease}</TableCell>
                        <TableCell>{ob.location}</TableCell>
                        <TableCell>
                          <Badge className={ob.status === "active" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}>
                            {ob.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{ob.cases}</TableCell>
                        <TableCell>{ob.deaths}</TableCell>
                        <TableCell>{ob.started}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{ob.lastUpdate}</TableCell>
                        <TableCell><Button variant="outline" size="sm">Manage</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inspections">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5" />
                      Inspections
                    </CardTitle>
                    <CardDescription>Linked to INDAWO sites — scheduled, ad-hoc, and follow-up inspections</CardDescription>
                  </div>
                  <Button className="gap-2"><Plus className="h-4 w-4" /> Schedule Inspection</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Site</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Inspector</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Findings</TableHead>
                      <TableHead>Critical</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SAMPLE_INSPECTIONS.map(ins => (
                      <TableRow key={ins.id}>
                        <TableCell className="font-mono text-xs">{ins.id}</TableCell>
                        <TableCell className="font-medium">{ins.site}</TableCell>
                        <TableCell>{ins.type}</TableCell>
                        <TableCell>{ins.inspector}</TableCell>
                        <TableCell>{ins.date}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize text-xs">{ins.status.replace(/_/g, " ")}</Badge>
                        </TableCell>
                        <TableCell>{ins.findings}</TableCell>
                        <TableCell>{ins.critical > 0 ? <Badge className="bg-red-100 text-red-700">{ins.critical}</Badge> : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="complaints">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Complaints, Alerts & Nuisance Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Reported</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SAMPLE_COMPLAINTS.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-xs">{c.id}</TableCell>
                        <TableCell className="font-medium">{c.type}</TableCell>
                        <TableCell>{c.location}</TableCell>
                        <TableCell>{c.reporter}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize text-xs">{c.status.replace(/_/g, " ")}</Badge></TableCell>
                        <TableCell>
                          <Badge className={
                            c.priority === "critical" ? "bg-red-100 text-red-700" :
                            c.priority === "high" ? "bg-orange-100 text-orange-700" :
                            "bg-blue-100 text-blue-700"
                          }>{c.priority}</Badge>
                        </TableCell>
                        <TableCell>{c.reported}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  Campaigns & Outreach
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {SAMPLE_CAMPAIGNS.map(cam => (
                    <div key={cam.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{cam.name}</p>
                          <p className="text-xs text-muted-foreground">{cam.type} • {cam.jurisdiction} • Started {cam.startDate}</p>
                        </div>
                        <Badge className={cam.status === "active" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}>
                          {cam.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Progress value={(cam.reached / cam.target) * 100} className="h-2" />
                        </div>
                        <span className="text-sm font-medium">
                          {cam.reached.toLocaleString()} / {cam.target.toLocaleString()} ({Math.round((cam.reached / cam.target) * 100)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="field">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> Field Operations</CardTitle>
                <CardDescription>Deployment tracking, team assignments, and response tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  Field team deployment, task assignment, GPS tracking, and mobile data collection interface
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emergency">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Siren className="h-5 w-5" /> Emergency Coordination</CardTitle>
                <CardDescription>Multi-agency emergency response coordination</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  Emergency operations center, resource mobilization, inter-agency communication, and situation reporting
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
