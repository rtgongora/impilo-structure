import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Megaphone, Plus, Package, MapPin, Users, Calendar, TrendingUp } from "lucide-react";

const CAMPAIGNS = [
  { id: "CAM-001", name: "COVID-19 Booster Rollout", type: "Immunization", status: "active", target: 500000, reached: 234567, startDate: "2026-01-15", endDate: "2026-06-30", jurisdiction: "National", sites: 450, teams: 120 },
  { id: "CAM-002", name: "School Deworming Programme", type: "NTD", status: "active", target: 120000, reached: 98000, startDate: "2026-02-01", endDate: "2026-04-30", jurisdiction: "Mashonaland East", sites: 284, teams: 45 },
  { id: "CAM-003", name: "Malaria IRS - Round 2", type: "Vector Control", status: "planning", target: 300000, reached: 0, startDate: "2026-04-01", endDate: "2026-06-30", jurisdiction: "Manicaland", sites: 156, teams: 60 },
  { id: "CAM-004", name: "HIV Testing Week", type: "Screening", status: "completed", target: 50000, reached: 52340, startDate: "2026-03-01", endDate: "2026-03-07", jurisdiction: "National", sites: 320, teams: 80 },
  { id: "CAM-005", name: "Cholera Vaccination — Harare", type: "Immunization", status: "active", target: 200000, reached: 45000, startDate: "2026-04-01", endDate: "2026-05-15", jurisdiction: "Harare", sites: 85, teams: 30 },
];

const SITE_COVERAGE = [
  { site: "Budiriro Clinic", ward: "Ward 22", target: 5000, vaccinated: 4200, wastage: "3.2%", stockRemaining: 850 },
  { site: "Glen Norah Polyclinic", ward: "Ward 29", target: 8000, vaccinated: 6100, wastage: "2.8%", stockRemaining: 2100 },
  { site: "Mbare Musika Outreach", ward: "Ward 1", target: 3000, vaccinated: 1200, wastage: "5.1%", stockRemaining: 1900 },
  { site: "Highfield Community Hall", ward: "Ward 14", target: 6000, vaccinated: 5800, wastage: "1.9%", stockRemaining: 250 },
  { site: "Epworth Clinic", ward: "Ward 7", target: 4000, vaccinated: 2800, wastage: "4.0%", stockRemaining: 1300 },
];

const SUPPLY_TRACKING = [
  { item: "OCV Vaccine (doses)", allocated: 200000, distributed: 165000, used: 142000, wastage: 4600, balance: 53400 },
  { item: "Syringes (0.5ml)", allocated: 210000, distributed: 175000, used: 142000, wastage: 1200, balance: 66800 },
  { item: "Safety Boxes", allocated: 4200, distributed: 3500, used: 2840, wastage: 0, balance: 1360 },
  { item: "Vaccination Cards", allocated: 200000, distributed: 170000, used: 142000, wastage: 500, balance: 57500 },
  { item: "Cold Boxes", allocated: 180, distributed: 160, used: 160, wastage: 0, balance: 20 },
];

export function EnhancedCampaignsTab() {
  return (
    <div className="space-y-4">
      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Active Campaigns", value: "3", icon: Megaphone },
          { label: "People Reached", value: "377K", icon: Users },
          { label: "Active Sites", value: "819", icon: MapPin },
          { label: "Field Teams", value: "210", icon: Users },
          { label: "Overall Coverage", value: "68%", icon: TrendingUp },
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

      <Tabs defaultValue="campaigns" className="space-y-3">
        <TabsList>
          <TabsTrigger value="campaigns">Campaign Registry</TabsTrigger>
          <TabsTrigger value="coverage">Site Coverage</TabsTrigger>
          <TabsTrigger value="supply">Supply & Logistics</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Campaign Registry</CardTitle>
                <Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> Plan Campaign</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {CAMPAIGNS.map(cam => (
                  <div key={cam.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{cam.name}</p>
                          <Badge variant="outline" className="text-xs">{cam.type}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {cam.jurisdiction} • {cam.startDate} to {cam.endDate} • {cam.sites} sites • {cam.teams} teams
                        </p>
                      </div>
                      <Badge className={
                        cam.status === "active" ? "bg-success/10 text-success" :
                        cam.status === "completed" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }>{cam.status}</Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Progress value={(cam.reached / cam.target) * 100} className="h-2.5" />
                      </div>
                      <span className="text-sm font-bold tabular-nums w-28 text-right">
                        {cam.reached.toLocaleString()} / {cam.target.toLocaleString()}
                      </span>
                      <span className="text-sm font-bold w-12 text-right">
                        {Math.round((cam.reached / cam.target) * 100)}%
                      </span>
                      <Button variant="outline" size="sm" className="h-7 text-xs">Manage</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coverage">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4" /> Site-Level Coverage Monitoring</CardTitle>
              <CardDescription>Cholera Vaccination — Harare (CAM-005)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Site</TableHead>
                    <TableHead>Ward</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Vaccinated</TableHead>
                    <TableHead>Coverage</TableHead>
                    <TableHead>Wastage</TableHead>
                    <TableHead>Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SITE_COVERAGE.map((s, i) => {
                    const coverage = Math.round((s.vaccinated / s.target) * 100);
                    return (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{s.site}</TableCell>
                        <TableCell className="text-xs">{s.ward}</TableCell>
                        <TableCell>{s.target.toLocaleString()}</TableCell>
                        <TableCell>{s.vaccinated.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={coverage} className="h-2 w-16" />
                            <span className={`text-xs font-bold ${coverage >= 80 ? "text-success" : coverage >= 50 ? "text-warning" : "text-destructive"}`}>{coverage}%</span>
                          </div>
                        </TableCell>
                        <TableCell className={parseFloat(s.wastage) > 4 ? "text-warning font-bold" : "text-xs"}>{s.wastage}</TableCell>
                        <TableCell className={s.stockRemaining < 500 ? "text-destructive font-bold" : ""}>{s.stockRemaining.toLocaleString()}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="supply">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4" /> Supply & Logistics Tracking</CardTitle>
              <CardDescription>Cholera Vaccination — Harare (CAM-005)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Allocated</TableHead>
                    <TableHead>Distributed</TableHead>
                    <TableHead>Used</TableHead>
                    <TableHead>Wastage</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Pipeline</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SUPPLY_TRACKING.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{s.item}</TableCell>
                      <TableCell>{s.allocated.toLocaleString()}</TableCell>
                      <TableCell>{s.distributed.toLocaleString()}</TableCell>
                      <TableCell>{s.used.toLocaleString()}</TableCell>
                      <TableCell className={s.wastage > 1000 ? "text-warning font-bold" : "text-xs"}>{s.wastage.toLocaleString()}</TableCell>
                      <TableCell>{s.balance.toLocaleString()}</TableCell>
                      <TableCell>
                        <Progress value={(s.used / s.allocated) * 100} className="h-2 w-20" />
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
