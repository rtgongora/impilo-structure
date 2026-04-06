import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Plus, FileText, CheckCircle } from "lucide-react";
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

export function EnhancedComplaintsTab() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [showLogForm, setShowLogForm] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null);

  const filtered = COMPLAINTS.filter(c => statusFilter === "all" || c.status === statusFilter);

  return (
    <div className="space-y-4">
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
              <Button size="sm" className="gap-1" onClick={() => setShowLogForm(!showLogForm)}>
                <Plus className="h-3.5 w-3.5" /> Log Complaint
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showLogForm && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-3">Log New Complaint / Alert</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Category</Label>
                    <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="environmental">Environmental</SelectItem>
                        <SelectItem value="food_safety">Food Safety</SelectItem>
                        <SelectItem value="water">Water Quality</SelectItem>
                        <SelectItem value="sanitation">Sanitation</SelectItem>
                        <SelectItem value="animal">Animal Control</SelectItem>
                        <SelectItem value="waste">Waste Management</SelectItem>
                        <SelectItem value="noise">Noise Nuisance</SelectItem>
                        <SelectItem value="disease">Disease / Health Alert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Complaint Type</Label><Input placeholder="e.g. Sewage Overflow" className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Location</Label><Input placeholder="Area, ward, address" className="h-8 text-xs" /></div>
                  <div>
                    <Label className="text-xs">Reporter</Label>
                    <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Source" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="citizen">Citizen</SelectItem>
                        <SelectItem value="councillor">Ward Councillor</SelectItem>
                        <SelectItem value="community">Community Leader</SelectItem>
                        <SelectItem value="eho">EHO (Internal)</SelectItem>
                        <SelectItem value="portal">Citizen Portal</SelectItem>
                        <SelectItem value="anonymous">Anonymous</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Priority</Label>
                    <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Assess" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Assign To</Label>
                    <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select officer" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tmoyo">T. Moyo</SelectItem>
                        <SelectItem value="jmoyo">J. Moyo</SelectItem>
                        <SelectItem value="rdube">R. Dube</SelectItem>
                        <SelectItem value="tndlovu">T. Ndlovu</SelectItem>
                        <SelectItem value="pchirwa">P. Chirwa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-3"><Label className="text-xs">Description</Label><Textarea placeholder="Detailed description of the complaint..." className="text-xs min-h-[60px]" /></div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm">Log Complaint</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowLogForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Days Open</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(c => (
                <>
                  <TableRow key={c.id} className={selectedComplaint === c.id ? "bg-primary/5" : ""}>
                    <TableCell className="font-mono text-xs">{c.id}</TableCell>
                    <TableCell className="font-medium">{c.type}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{c.category}</Badge></TableCell>
                    <TableCell>{c.location}</TableCell>
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
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setSelectedComplaint(selectedComplaint === c.id ? null : c.id)}>
                        {selectedComplaint === c.id ? "Close" : "Act"}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {selectedComplaint === c.id && (
                    <TableRow key={c.id + "-action"}>
                      <TableCell colSpan={9}>
                        <div className="p-3 bg-muted/30 rounded-lg space-y-3">
                          <h4 className="text-sm font-semibold">Action on Complaint — {c.type}</h4>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label className="text-xs">Action</Label>
                              <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select action" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="investigate">Start Investigation</SelectItem>
                                  <SelectItem value="site_visit">Schedule Site Visit</SelectItem>
                                  <SelectItem value="enforce">Issue Enforcement Notice</SelectItem>
                                  <SelectItem value="reassign">Reassign Officer</SelectItem>
                                  <SelectItem value="escalate">Escalate Priority</SelectItem>
                                  <SelectItem value="resolve">Mark Resolved</SelectItem>
                                  <SelectItem value="close">Close (No Action)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Update Status</Label>
                              <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="New status" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="assigned">Assigned</SelectItem>
                                  <SelectItem value="investigating">Investigating</SelectItem>
                                  <SelectItem value="enforcement_pending">Enforcement Pending</SelectItem>
                                  <SelectItem value="awaiting_compliance">Awaiting Compliance</SelectItem>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div><Label className="text-xs">Site Visit Date</Label><Input type="date" className="h-8 text-xs" /></div>
                          </div>
                          <div><Label className="text-xs">Action Notes / Findings</Label><Textarea placeholder="Document actions taken, findings, evidence..." className="text-xs min-h-[60px]" /></div>
                          <div className="flex gap-2">
                            <Button size="sm">Save & Update</Button>
                            <Button size="sm" variant="outline">Link to Inspection</Button>
                            <Button size="sm" variant="outline">Notify Reporter</Button>
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
    </div>
  );
}