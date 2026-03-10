import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building, MapPin, Search, Plus, Filter, Eye, ClipboardCheck, AlertTriangle,
  ShieldCheck, BarChart3, Globe, Landmark, TreePine, Ship, School, Droplets,
  Trash2, Store, UtensilsCrossed, Warehouse, Activity
} from "lucide-react";
import { useState } from "react";

const SITE_TYPES = [
  { id: "market", label: "Market / Trading Post", icon: Store, count: 342, color: "bg-amber-500" },
  { id: "school", label: "School", icon: School, count: 1284, color: "bg-blue-500" },
  { id: "water_point", label: "Water Point / Borehole", icon: Droplets, count: 2105, color: "bg-cyan-500" },
  { id: "waste_site", label: "Waste Disposal Site", icon: Trash2, count: 89, color: "bg-gray-500" },
  { id: "port_of_entry", label: "Port of Entry", icon: Ship, count: 14, color: "bg-indigo-500" },
  { id: "food_premises", label: "Food Premises", icon: UtensilsCrossed, count: 4521, color: "bg-orange-500" },
  { id: "abattoir", label: "Abattoir / Slaughterhouse", icon: Warehouse, count: 67, color: "bg-red-500" },
  { id: "vending_zone", label: "Vending Zone", icon: Store, count: 198, color: "bg-purple-500" },
  { id: "public_toilet", label: "Public Toilet / Ablution", icon: Building, count: 456, color: "bg-teal-500" },
  { id: "cemetery", label: "Cemetery / Crematorium", icon: Landmark, count: 234, color: "bg-stone-500" },
  { id: "recreation", label: "Recreation / Public Pool", icon: TreePine, count: 78, color: "bg-green-500" },
  { id: "accommodation", label: "Accommodation / Hospitality", icon: Building, count: 891, color: "bg-rose-500" },
];

const SAMPLE_SITES = [
  { id: "IND-001", name: "Mbare Musika Market", type: "market", jurisdiction: "City of Harare", ward: "Ward 3", status: "active", lastInspection: "2026-01-15", compliance: "compliant", operator: "City of Harare Markets Dept", lat: -17.8419, lng: 31.0678 },
  { id: "IND-002", name: "Warren Park Primary School", type: "school", jurisdiction: "City of Harare", ward: "Ward 28", status: "active", lastInspection: "2025-11-20", compliance: "minor_issues", operator: "Ministry of Education", lat: -17.8312, lng: 31.0012 },
  { id: "IND-003", name: "Beitbridge Border Post", type: "port_of_entry", jurisdiction: "Beitbridge RDC", ward: "N/A", status: "active", lastInspection: "2026-02-01", compliance: "compliant", operator: "ZIMRA / Port Health", lat: -22.2170, lng: 30.0021 },
  { id: "IND-004", name: "Southerton Abattoir", type: "abattoir", jurisdiction: "City of Harare", ward: "Ward 15", status: "active", lastInspection: "2026-01-28", compliance: "non_compliant", operator: "Cold Storage Commission", lat: -17.8560, lng: 31.0234 },
  { id: "IND-005", name: "Chitungwiza Borehole #47", type: "water_point", jurisdiction: "Chitungwiza Municipality", ward: "Ward 12", status: "active", lastInspection: "2025-12-10", compliance: "compliant", operator: "ZINWA", lat: -17.9956, lng: 31.0754 },
  { id: "IND-006", name: "Chicken Inn - Jason Moyo", type: "food_premises", jurisdiction: "City of Harare", ward: "Ward 1", status: "active", lastInspection: "2026-02-20", compliance: "compliant", operator: "Simbisa Brands", lat: -17.8292, lng: 31.0520 },
  { id: "IND-007", name: "Warren Hills Cemetery", type: "cemetery", jurisdiction: "City of Harare", ward: "Ward 30", status: "active", lastInspection: "2025-10-05", compliance: "minor_issues", operator: "City of Harare", lat: -17.8245, lng: 31.0234 },
  { id: "IND-008", name: "Kopje Street Vending Zone", type: "vending_zone", jurisdiction: "City of Harare", ward: "Ward 2", status: "suspended", lastInspection: "2026-01-05", compliance: "non_compliant", operator: "Informal Sector", lat: -17.8350, lng: 31.0490 },
];

const complianceBadge = (status: string) => {
  switch (status) {
    case "compliant": return <Badge className="bg-green-100 text-green-700">Compliant</Badge>;
    case "minor_issues": return <Badge className="bg-amber-100 text-amber-700">Minor Issues</Badge>;
    case "non_compliant": return <Badge className="bg-red-100 text-red-700">Non-Compliant</Badge>;
    default: return <Badge variant="outline">Unknown</Badge>;
  }
};

const statusBadge = (status: string) => {
  switch (status) {
    case "active": return <Badge className="bg-green-100 text-green-700">Active</Badge>;
    case "suspended": return <Badge className="bg-red-100 text-red-700">Suspended</Badge>;
    case "decommissioned": return <Badge variant="outline">Decommissioned</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

export default function IndawoAdmin() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredSites = SAMPLE_SITES.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter === "all" || s.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <AppLayout title="INDAWO — Site & Premises Registry">
      <Tabs defaultValue="registry" className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="h-6 w-6 text-primary" />
              INDAWO — Site & Premises Registry
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Canonical registry for regulated premises and public-health operational sites. 
              <span className="font-medium ml-1">Not clinical facilities — those are managed by TUSO.</span>
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Register Site
          </Button>
        </div>

        {/* TUSO vs INDAWO distinction banner */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="py-3 px-4">
            <div className="flex items-start gap-3">
              <div className="flex gap-2 items-center">
                <Badge className="bg-blue-100 text-blue-700">TUSO</Badge>
                <span className="text-sm">Health service-delivery facilities (clinics, hospitals)</span>
              </div>
              <div className="text-muted-foreground">vs</div>
              <div className="flex gap-2 items-center">
                <Badge className="bg-emerald-100 text-emerald-700">INDAWO</Badge>
                <span className="text-sm">Regulated premises & public-health operational sites (markets, schools, water points, ports)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <TabsList className="inline-flex w-max">
          <TabsTrigger value="registry">Site Registry</TabsTrigger>
          <TabsTrigger value="types">Site Types</TabsTrigger>
          <TabsTrigger value="inspections">Inspection Linkage</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Dashboard</TabsTrigger>
          <TabsTrigger value="geography">Geography & Jurisdiction</TabsTrigger>
          <TabsTrigger value="events">Events & Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="registry">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Registered Sites & Premises</CardTitle>
                  <CardDescription>{SAMPLE_SITES.length.toLocaleString()} sites across all jurisdictions</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search sites..." className="pl-9 w-64" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {SITE_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Site ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Jurisdiction</TableHead>
                    <TableHead>Ward</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Compliance</TableHead>
                    <TableHead>Last Inspection</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSites.map(site => (
                    <TableRow key={site.id}>
                      <TableCell className="font-mono text-xs">{site.id}</TableCell>
                      <TableCell className="font-medium">{site.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">{site.type.replace(/_/g, " ")}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{site.jurisdiction}</TableCell>
                      <TableCell className="text-sm">{site.ward}</TableCell>
                      <TableCell>{statusBadge(site.status)}</TableCell>
                      <TableCell>{complianceBadge(site.compliance)}</TableCell>
                      <TableCell className="text-sm">{site.lastInspection}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{site.operator}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {SITE_TYPES.map(type => (
              <Card key={type.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${type.color} flex items-center justify-center`}>
                      <type.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{type.label}</p>
                      <p className="text-2xl font-bold">{type.count.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="inspections">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Inspection & Compliance Linkage
              </CardTitle>
              <CardDescription>Sites linked to inspection schedules, findings, and enforcement actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {SAMPLE_SITES.slice(0, 4).map(site => (
                  <div key={site.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <div>
                        <p className="font-medium">{site.name}</p>
                        <p className="text-xs text-muted-foreground">Last inspection: {site.lastInspection}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {complianceBadge(site.compliance)}
                      <Badge variant="outline" className="text-xs">3 findings</Badge>
                      <Button variant="outline" size="sm">View History</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card>
              <CardContent className="p-4 text-center">
                <ShieldCheck className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-3xl font-bold">78%</p>
                <p className="text-sm text-muted-foreground">Compliant Sites</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <p className="text-3xl font-bold">15%</p>
                <p className="text-sm text-muted-foreground">Minor Issues</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-3xl font-bold">7%</p>
                <p className="text-sm text-muted-foreground">Non-Compliant</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geography">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Geography & Jurisdiction Mapping
              </CardTitle>
              <CardDescription>Sites linked to provinces, districts, wards, and catchment areas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-2xl font-bold">10</p>
                  <p className="text-sm text-muted-foreground">Provinces</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-2xl font-bold">92</p>
                  <p className="text-sm text-muted-foreground">Districts</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-2xl font-bold">1,958</p>
                  <p className="text-sm text-muted-foreground">Wards</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-2xl font-bold">10,279</p>
                  <p className="text-sm text-muted-foreground">Total Sites</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                INDAWO Event Stream
              </CardTitle>
              <CardDescription>Events emitted: impilo.indawo.site.created.v1 / updated.v1 / status.changed.v1</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { type: "impilo.indawo.site.created.v1", site: "New Food Premises - Avondale", time: "2 min ago" },
                  { type: "impilo.indawo.site.status.changed.v1", site: "Kopje Vending Zone → SUSPENDED", time: "15 min ago" },
                  { type: "impilo.indawo.site.updated.v1", site: "Mbare Musika - operator changed", time: "1 hr ago" },
                  { type: "impilo.indawo.snapshot.sites.v1", site: "Full snapshot (10,279 sites)", time: "6 hrs ago" },
                ].map((evt, i) => (
                  <div key={i} className="flex items-center justify-between p-2 border rounded text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">{evt.type}</Badge>
                      <span>{evt.site}</span>
                    </div>
                    <span className="text-muted-foreground text-xs">{evt.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
