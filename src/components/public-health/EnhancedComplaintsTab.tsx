import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Plus, MessageSquare, Search, Filter, FileText, CheckCircle, Clock, Scale } from "lucide-react";
import { useState } from "react";

const COMPLAINTS = [
  { id: "CMP-001", type: "Noise Nuisance", category: "Environmental", location: "Borrowdale", status: "investigating", reported: "2026-04-08", reporter: "Citizen", priority: "medium", assignedTo: "T. Moyo", daysOpen: 2 },
  { id: "CMP-002", type: "Illegal Dumping", category: "Waste", location: "Highfield", status: "enforcement_pending", reported: "2026-04-05", reporter: "Ward Councillor", priority: "high", assignedTo: "J. Moyo", daysOpen: 5 },
  { id: "CMP-003", type: "Expired Food Products", category: "Food Safety", location: "CBD Shop", status: "resolved", reported: "2026-04-01", reporter: "Anonymous", priority: "high", assignedTo: "S. Makoni", daysOpen: 0 },
  { id: "CMP-004", type: "Water Contamination", category: "Water", location: "Glen Norah Borehole", status: "investigating", reported: "2026-04-09", reporter: "Community Leader", priority: "critical", assignedTo: "R. Dube", daysOpen: 1 },
  { id: "CMP-005", type: "Stray Animals", category: "Animal Control", location: "Mbare", status: "assigned", reported: "2026-04-06", reporter: "Citizen", priority: "low", assignedTo: "P. Chirwa", daysOpen: 4 },
  { id: "CMP-006", type: "Sewage Overflow", category: "Sanitation", location: "Chitungwiza Unit L", status: "investigating", reported: "2026-04-07", reporter: "Citizen", priority: "critical", assignedTo: "T. Ndlovu", daysOpen: 3 },
  { id: "CMP-007", type: "Unlicensed Food Vendor", category: "Food Safety", location: "Harare CBD", status: "assigned", reported: "2026-04-09", reporter: "EHO", priority: "medium", assignedTo: "J. Moyo", daysOpen: 1 },
];

const RESOLUTION_LOG = [
  { id: "CMP-003", type: "Expired Food Products", resolution: "Products removed, premises re-inspected, compliance notice issued", resolvedBy: "S. Makoni", resolvedDate: "2026-04-03", satisfactionRating: 4 },
  { id: "CMP-010", type: "Blocked Drain", resolution: "Drain cleared, municipal works notified for permanent fix", resolvedBy: "T. Moyo", resolvedDate: "2026-03-30", satisfactionRating: 5 },
  { id: "CMP-008", type: "Dog Bite Incident", resolution: "Animal captured, owner fined, rabies PEP administered", resolvedBy: "P. Chirwa", resolvedDate: "2026-03-28", satisfactionRating: 3 },
];

export function EnhancedComplaintsTab() {
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = COMPLAINTS.filter(c => statusFilter === "all" || c.status === statusFilter);

  return (
    <div className="space-y-4">
      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Open Complaints", value: "18", color: "text-warning" },
          { label: "Critical Priority", value: "3", color: "text-destructive" },
          { label: "Avg Resolution (days)", value: "4.2", color: "text-primary" },
          { label: "Resolved This Month", value: "34", color: "text-success" },
          { label: "Satisfaction Score", value: "4.1/5", color: "text-info" },
        ].map((kpi, i) => (
          <Card key={i}>
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs font-medium">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="active" className="space-y-3">
        <TabsList>
          <TabsTrigger value="active">Active Complaints</TabsTrigger>
          <TabsTrigger value="resolved">Resolution Log</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Complaints, Alerts & Nuisance Management</CardTitle>
                  <CardDescription>Intake, investigation, enforcement, and resolution tracking</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="enforcement_pending">Enforcement</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> Log Complaint</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Days Open</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.id}</TableCell>
                      <TableCell className="font-medium">{c.type}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{c.category}</Badge></TableCell>
                      <TableCell>{c.location}</TableCell>
                      <TableCell className="text-xs">{c.reporter}</TableCell>
                      <TableCell>
                        <Badge className={
                          c.priority === "critical" ? "bg-destructive/10 text-destructive" :
                          c.priority === "high" ? "bg-warning/10 text-warning" :
                          c.priority === "low" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                        }>{c.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">{c.status.replace(/_/g, " ")}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{c.assignedTo}</TableCell>
                      <TableCell className={c.daysOpen > 3 ? "text-warning font-bold" : ""}>{c.daysOpen}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7"><FileText className="h-3.5 w-3.5" /></Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs">Update</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolved">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Resolution Log</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Complaint ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Resolution</TableHead>
                    <TableHead>Resolved By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Satisfaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {RESOLUTION_LOG.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.id}</TableCell>
                      <TableCell className="font-medium">{r.type}</TableCell>
                      <TableCell className="max-w-[300px] text-xs">{r.resolution}</TableCell>
                      <TableCell>{r.resolvedBy}</TableCell>
                      <TableCell className="text-xs">{r.resolvedDate}</TableCell>
                      <TableCell>{"⭐".repeat(r.satisfactionRating)}</TableCell>
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
