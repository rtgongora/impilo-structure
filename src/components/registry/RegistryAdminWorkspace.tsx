// Registry Admin Workspace — maker-checker pattern for high-trust registry operations
import React, { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users, Stethoscope, Building2, Shield, BookOpen, Search,
  ClipboardList, CheckCircle2, XCircle, Clock, Eye, FileText,
  AlertTriangle, ArrowLeft, Lock, History, BarChart3, Plus,
  GitMerge, UserCheck, Loader2,
} from "lucide-react";

type RegistryType = "vito" | "varapi" | "tuso" | "tshepo" | "zibo" | "indawo" | "msika";
type ChangeRequestStatus = "submitted" | "under_review" | "approved" | "rejected" | "escalated";

interface ChangeRequest {
  id: string;
  title: string;
  description: string;
  submittedBy: string;
  submittedAt: string;
  status: ChangeRequestStatus;
  priority: "normal" | "high" | "critical";
  registry: RegistryType;
  changeType: string;
  reviewNotes?: string;
}

const REGISTRY_CONFIG: Record<RegistryType, { label: string; fullLabel: string; icon: React.ElementType; color: string; bg: string }> = {
  vito: { label: "VITO", fullLabel: "Client Registry", icon: Users, color: "text-blue-600", bg: "bg-blue-500/10" },
  varapi: { label: "VARAPI", fullLabel: "Provider Registry", icon: Stethoscope, color: "text-teal-600", bg: "bg-teal-500/10" },
  tuso: { label: "TUSO", fullLabel: "Facility Registry", icon: Building2, color: "text-amber-600", bg: "bg-amber-500/10" },
  tshepo: { label: "TSHEPO", fullLabel: "Trust & IAM", icon: Shield, color: "text-indigo-600", bg: "bg-indigo-500/10" },
  zibo: { label: "ZIBO", fullLabel: "Terminology", icon: BookOpen, color: "text-purple-600", bg: "bg-purple-500/10" },
};

const MOCK_CHANGE_REQUESTS: ChangeRequest[] = [
  { id: "CR-001", title: "Merge duplicate client records", description: "Records CR-4521 and CR-4523 appear to be the same person based on biometric match (98.7%)", submittedBy: "T. Mapfumo", submittedAt: "2h ago", status: "submitted", priority: "high", registry: "vito", changeType: "merge" },
  { id: "CR-002", title: "Provider status change — license expiry", description: "Dr. Moyo's MCAZ license has expired. Update status to 'suspended' pending renewal.", submittedBy: "N. Chirwa", submittedAt: "4h ago", status: "under_review", priority: "critical", registry: "varapi", changeType: "status_change" },
  { id: "CR-003", title: "New facility registration — Mbare Polyclinic", description: "Register Mbare Polyclinic as a Level 2 primary health centre in Harare Metropolitan.", submittedBy: "R. Gumbo", submittedAt: "1d ago", status: "submitted", priority: "normal", registry: "tuso", changeType: "create" },
  { id: "CR-004", title: "Bulk import — ICD-11 code system update", description: "Import 245 new ICD-11 codes from WHO 2026 release.", submittedBy: "System", submittedAt: "2d ago", status: "under_review", priority: "high", registry: "zibo", changeType: "bulk_import" },
  { id: "CR-005", title: "Privilege elevation — Emergency super-admin", description: "Temporary elevation for T. Banda to resolve account lockout affecting 12 users.", submittedBy: "S. Moyo", submittedAt: "30m ago", status: "submitted", priority: "critical", registry: "tshepo", changeType: "privilege_elevation" },
  { id: "CR-006", title: "Identity dispute resolution", description: "Client claims record belongs to different person. Requires verification.", submittedBy: "K. Nkomo", submittedAt: "6h ago", status: "submitted", priority: "normal", registry: "vito", changeType: "dispute" },
];

interface RegistryAdminWorkspaceProps {
  registry: RegistryType;
  onBack: () => void;
}

export function RegistryAdminWorkspace({ registry, onBack }: RegistryAdminWorkspaceProps) {
  const config = REGISTRY_CONFIG[registry];
  const [requests, setRequests] = useState<ChangeRequest[]>(MOCK_CHANGE_REQUESTS.filter(r => r.registry === registry));
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(null);
  const [reviewJustification, setReviewJustification] = useState("");
  const [activeTab, setActiveTab] = useState("queue");

  const submitted = requests.filter(r => r.status === "submitted");
  const underReview = requests.filter(r => r.status === "under_review");
  const resolved = requests.filter(r => r.status === "approved" || r.status === "rejected");

  const handleApprove = (cr: ChangeRequest) => {
    if (!reviewJustification.trim()) {
      toast.error("Justification required", { description: "Provide a reason for approval" });
      return;
    }
    setRequests(prev => prev.map(r => r.id === cr.id ? { ...r, status: "approved" as ChangeRequestStatus, reviewNotes: reviewJustification } : r));
    toast.success("Change request approved", { description: `${cr.id}: ${cr.title}` });
    setSelectedRequest(null);
    setReviewJustification("");
  };

  const handleReject = (cr: ChangeRequest) => {
    if (!reviewJustification.trim()) {
      toast.error("Justification required", { description: "Provide a reason for rejection" });
      return;
    }
    setRequests(prev => prev.map(r => r.id === cr.id ? { ...r, status: "rejected" as ChangeRequestStatus, reviewNotes: reviewJustification } : r));
    toast.info("Change request rejected", { description: `${cr.id}: ${cr.title}` });
    setSelectedRequest(null);
    setReviewJustification("");
  };

  const handleStartReview = (cr: ChangeRequest) => {
    setRequests(prev => prev.map(r => r.id === cr.id ? { ...r, status: "under_review" as ChangeRequestStatus } : r));
    setSelectedRequest(cr);
    toast.info("Review started", { description: `${cr.id} is now under review` });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
            <div className={`h-12 w-12 rounded-xl ${config.bg} flex items-center justify-center`}>
              <config.icon className={`h-6 w-6 ${config.color}`} />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display">{config.fullLabel} Administration</h1>
              <p className="text-sm text-muted-foreground">{config.label} • High-trust administrative workspace</p>
            </div>
            <Badge variant="outline" className="ml-auto gap-1"><Lock className="h-3 w-3" /> Elevated Access</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pending Review</p><p className="text-2xl font-bold mt-1">{submitted.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Under Review</p><p className="text-2xl font-bold mt-1">{underReview.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Resolved Today</p><p className="text-2xl font-bold mt-1">{resolved.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Audit Events</p><p className="text-2xl font-bold mt-1">47</p></CardContent></Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="queue" className="gap-1"><ClipboardList className="h-3.5 w-3.5" /> Review Queue</TabsTrigger>
            <TabsTrigger value="search" className="gap-1"><Search className="h-3.5 w-3.5" /> Search</TabsTrigger>
            <TabsTrigger value="audit" className="gap-1"><History className="h-3.5 w-3.5" /> Audit Trail</TabsTrigger>
            <TabsTrigger value="reports" className="gap-1"><BarChart3 className="h-3.5 w-3.5" /> Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="mt-4 space-y-4">
            {/* Submitted — awaiting first reviewer */}
            {submitted.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Clock className="h-4 w-4 text-amber-500" /> Awaiting Review ({submitted.length})</h3>
                <div className="space-y-2">
                  {submitted.map(cr => (
                    <ChangeRequestCard key={cr.id} cr={cr} onReview={() => handleStartReview(cr)} />
                  ))}
                </div>
              </div>
            )}

            {/* Under review */}
            {underReview.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Eye className="h-4 w-4 text-blue-500" /> Under Review ({underReview.length})</h3>
                <div className="space-y-2">
                  {underReview.map(cr => (
                    <ChangeRequestCard key={cr.id} cr={cr} onReview={() => setSelectedRequest(cr)} expanded />
                  ))}
                </div>
              </div>
            )}

            {submitted.length === 0 && underReview.length === 0 && (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No pending change requests for this registry.</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="search" className="mt-4">
            <Card><CardHeader><CardTitle className="text-base">Registry Search</CardTitle><CardDescription>Search records in {config.fullLabel}</CardDescription></CardHeader>
              <CardContent>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={`Search ${config.fullLabel}...`} className="pl-10" />
                </div>
                <p className="text-sm text-muted-foreground text-center py-8">Enter a search term to find records</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="mt-4">
            <Card><CardHeader><CardTitle className="text-base">Audit Trail</CardTitle><CardDescription>All administrative actions are logged with tamper-evident hashing</CardDescription></CardHeader>
              <CardContent className="space-y-2">
                {[
                  { action: "Record reviewed", actor: "T. Mapfumo", time: "2h ago", target: "CR-4521" },
                  { action: "Status changed", actor: "N. Chirwa", time: "4h ago", target: "Provider #2341" },
                  { action: "Merge approved", actor: "S. Moyo", time: "1d ago", target: "CR-4519/4520" },
                  { action: "Bulk import initiated", actor: "System", time: "2d ago", target: "ICD-11 v2026" },
                ].map((log, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border text-sm">
                    <div>
                      <span className="font-medium">{log.action}</span>
                      <span className="text-muted-foreground"> — {log.target}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{log.actor} • {log.time}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="mt-4">
            <Card><CardContent className="p-8 text-center text-muted-foreground">Registry analytics and compliance reports</CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Dialog (maker-checker approval) */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => { if (!open) setSelectedRequest(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Review Change Request
            </DialogTitle>
            <DialogDescription>
              Maker-checker approval required. Your decision will be audit-logged.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{selectedRequest.id}</Badge>
                  <Badge variant={selectedRequest.priority === "critical" ? "destructive" : selectedRequest.priority === "high" ? "secondary" : "outline"}>
                    {selectedRequest.priority}
                  </Badge>
                </div>
                <h4 className="font-semibold">{selectedRequest.title}</h4>
                <p className="text-sm text-muted-foreground">{selectedRequest.description}</p>
                <Separator />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Submitted by {selectedRequest.submittedBy}</span>
                  <span>{selectedRequest.submittedAt}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="justification">Review Justification (required)</Label>
                <Textarea
                  id="justification"
                  placeholder="Provide your rationale for approval or rejection..."
                  value={reviewJustification}
                  onChange={e => setReviewJustification(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setSelectedRequest(null); setReviewJustification(""); }}>Cancel</Button>
            <Button variant="destructive" onClick={() => selectedRequest && handleReject(selectedRequest)} className="gap-1">
              <XCircle className="h-4 w-4" /> Reject
            </Button>
            <Button onClick={() => selectedRequest && handleApprove(selectedRequest)} className="gap-1">
              <CheckCircle2 className="h-4 w-4" /> Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Change request card
function ChangeRequestCard({ cr, onReview, expanded }: { cr: ChangeRequest; onReview: () => void; expanded?: boolean }) {
  const priorityColors: Record<string, string> = {
    critical: "border-l-red-500",
    high: "border-l-amber-500",
    normal: "border-l-blue-500",
  };
  const statusIcons: Record<string, React.ElementType> = {
    submitted: Clock,
    under_review: Eye,
    approved: CheckCircle2,
    rejected: XCircle,
  };
  const StatusIcon = statusIcons[cr.status] || Clock;

  return (
    <Card className={`border-l-4 ${priorityColors[cr.priority] || "border-l-border"}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px]">{cr.id}</Badge>
              <Badge variant="outline" className="text-[10px]">{cr.changeType}</Badge>
              {cr.priority === "critical" && <Badge variant="destructive" className="text-[10px]">Critical</Badge>}
            </div>
            <h4 className="font-semibold text-sm mt-1.5">{cr.title}</h4>
            {expanded && <p className="text-xs text-muted-foreground mt-1">{cr.description}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              <StatusIcon className="h-3 w-3 inline mr-1" />
              {cr.submittedBy} • {cr.submittedAt}
            </p>
          </div>
          <Button size="sm" variant={cr.status === "submitted" ? "default" : "outline"} className="h-8 text-xs shrink-0" onClick={onReview}>
            {cr.status === "submitted" ? "Start Review" : "Review"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
