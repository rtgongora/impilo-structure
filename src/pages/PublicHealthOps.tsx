import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity, AlertTriangle, Bug, ClipboardCheck, Globe, Megaphone, MapPin,
  Shield, Siren, Users, Settings, Building, TreePine, Ship, School, Target, Radio
} from "lucide-react";
import { useState } from "react";
import { SurveillanceTab } from "@/components/public-health/SurveillanceTab";
import { EnhancedOutbreaksTab } from "@/components/public-health/EnhancedOutbreaksTab";
import { EnhancedInspectionsTab } from "@/components/public-health/EnhancedInspectionsTab";
import { EnhancedComplaintsTab } from "@/components/public-health/EnhancedComplaintsTab";
import { EnhancedCampaignsTab } from "@/components/public-health/EnhancedCampaignsTab";
import { FieldOperationsTab } from "@/components/public-health/FieldOperationsTab";
import { EmergencyCoordinationTab } from "@/components/public-health/EmergencyCoordinationTab";

const JURISDICTION_PACKS = [
  { id: "city_health", label: "City Health Pack", description: "Urban municipal public health operations", icon: Building, color: "bg-blue-500", activeIn: "Harare, Bulawayo, Mutare, Gweru, Kwekwe, Masvingo" },
  { id: "rdc_health", label: "Rural District Council Health Pack", description: "Rural public health operations and community health", icon: TreePine, color: "bg-green-500", activeIn: "62 Rural District Councils" },
  { id: "provincial", label: "Provincial Public Health Oversight Pack", description: "Provincial surveillance, coordination, and oversight", icon: Globe, color: "bg-purple-500", activeIn: "All 10 Provinces" },
  { id: "national", label: "National Public Health Oversight Pack", description: "National surveillance, policy, and coordination", icon: Shield, color: "bg-red-500", activeIn: "National" },
  { id: "port_health", label: "Port Health Pack", description: "Border and port of entry health operations", icon: Ship, color: "bg-indigo-500", activeIn: "14 Ports of Entry" },
  { id: "school_health", label: "School Health Pack", description: "School-based health services and inspections", icon: School, color: "bg-amber-500", activeIn: "1,284 Schools" },
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
            <div className="space-y-4">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {[
                  { icon: Bug, value: "3", label: "Active Outbreaks", color: "text-destructive" },
                  { icon: ClipboardCheck, value: "142", label: "Inspections This Month", color: "text-primary" },
                  { icon: AlertTriangle, value: "18", label: "Open Complaints", color: "text-warning" },
                  { icon: Megaphone, value: "3", label: "Active Campaigns", color: "text-success" },
                  { icon: Users, value: "377K", label: "People Reached", color: "text-info" },
                  { icon: Siren, value: "Level 2", label: "EOC Status", color: "text-destructive" },
                ].map((kpi, i) => (
                  <Card key={i}>
                    <CardContent className="p-3 text-center">
                      <kpi.icon className={`h-5 w-5 mx-auto mb-1.5 ${kpi.color}`} />
                      <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                      <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Outbreak + Complaints Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Siren className="h-4 w-4" /> Active Outbreaks</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { disease: "Cholera — Budiriro, Harare", cases: 47, deaths: 2, severity: "high" },
                      { disease: "Typhoid — Chitungwiza", cases: 23, deaths: 0, severity: "medium" },
                    ].map((ob, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{ob.disease}</p>
                          <p className="text-xs text-muted-foreground">{ob.cases} cases, {ob.deaths} deaths</p>
                        </div>
                        <Badge className={ob.severity === "high" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}>
                          {ob.severity}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Critical Complaints</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { type: "Water Contamination", location: "Glen Norah Borehole", priority: "critical", days: 1 },
                      { type: "Sewage Overflow", location: "Chitungwiza Unit L", priority: "critical", days: 3 },
                      { type: "Illegal Dumping", location: "Highfield", priority: "high", days: 5 },
                    ].map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{c.type}</p>
                          <p className="text-xs text-muted-foreground">{c.location} • {c.days}d open</p>
                        </div>
                        <Badge className={c.priority === "critical" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}>
                          {c.priority}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Campaigns Progress + Reporting */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Megaphone className="h-4 w-4" /> Campaign Progress</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { name: "COVID-19 Booster", target: 500000, reached: 234567 },
                      { name: "School Deworming", target: 120000, reached: 98000 },
                      { name: "Cholera Vaccination — Harare", target: 200000, reached: 45000 },
                    ].map((c, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium">{c.name}</span>
                          <span>{Math.round((c.reached / c.target) * 100)}%</span>
                        </div>
                        <Progress value={(c.reached / c.target) * 100} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Radio className="h-4 w-4" /> Surveillance Reporting</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { label: "Weekly IDSR Completeness", value: 89, target: 80 },
                      { label: "Timeliness of Reporting", value: 76, target: 80 },
                      { label: "Case Investigation Rate", value: 92, target: 90 },
                      { label: "Lab Confirmation Rate", value: 68, target: 75 },
                    ].map((m, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium">{m.label}</span>
                          <span className={m.value >= m.target ? "text-success" : "text-warning"}>{m.value}% (target: {m.target}%)</span>
                        </div>
                        <Progress value={m.value} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="surveillance"><SurveillanceTab /></TabsContent>
          <TabsContent value="outbreaks"><EnhancedOutbreaksTab /></TabsContent>
          <TabsContent value="inspections"><EnhancedInspectionsTab /></TabsContent>
          <TabsContent value="complaints"><EnhancedComplaintsTab /></TabsContent>
          <TabsContent value="campaigns"><EnhancedCampaignsTab /></TabsContent>
          <TabsContent value="field"><FieldOperationsTab /></TabsContent>
          <TabsContent value="emergency"><EmergencyCoordinationTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
