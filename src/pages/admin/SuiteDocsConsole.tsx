import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Shield, AlertTriangle, Search, Archive, Trash2, Link2, Clock } from "lucide-react";

export default function SuiteDocsConsole() {
  const [subjectId, setSubjectId] = useState("");
  const [subjectType, setSubjectType] = useState("all");
  const [lifecycleFilter, setLifecycleFilter] = useState("ACTIVE");
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [actionReason, setActionReason] = useState("");
  const qc = useQueryClient();

  const { data: docs, isLoading } = useQuery({
    queryKey: ["suite-docs", subjectId, subjectType, lifecycleFilter],
    queryFn: async () => {
      let q = supabase.from("suite_documents").select("*").order("created_at", { ascending: false }).limit(100);
      if (subjectId) q = q.eq("subject_id", subjectId);
      if (subjectType !== "all") q = q.eq("subject_type", subjectType);
      if (lifecycleFilter !== "all") q = q.eq("lifecycle_state", lifecycleFilter);
      const { data } = await q;
      return data || [];
    },
  });

  const { data: hrq } = useQuery({
    queryKey: ["suite-hrq"],
    queryFn: async () => {
      const { data } = await supabase.from("suite_high_risk_queue").select("*").eq("status", "PENDING").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: auditEvents } = useQuery({
    queryKey: ["suite-audit", selectedDoc?.id],
    queryFn: async () => {
      if (!selectedDoc) return [];
      const { data } = await supabase.from("suite_audit_events").select("*").eq("resource_id", selectedDoc.id).order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
    enabled: !!selectedDoc,
  });

  const lifecycleMutation = useMutation({
    mutationFn: async ({ id, action, reason }: { id: string; action: string; reason: string }) => {
      const stateMap: Record<string, string> = { archive: "ARCHIVED", revoke: "REVOKED", supersede: "SUPERSEDED", delete: "DELETED" };
      await supabase.from("suite_documents").update({ lifecycle_state: stateMap[action] }).eq("id", id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["suite-docs"] }); toast.success("Lifecycle updated"); },
  });

  const confidentialityColor = (c: string) => {
    if (c === "HIGHLY_RESTRICTED") return "destructive";
    if (c === "RESTRICTED") return "secondary";
    return "outline";
  };

  const lifecycleColor = (s: string) => {
    const map: Record<string, string> = { ACTIVE: "default", REVOKED: "destructive", SUPERSEDED: "secondary", ARCHIVED: "outline", DELETED: "destructive" };
    return (map[s] || "default") as any;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ops Docs Console</h1>
          <p className="text-muted-foreground">Landela + Credentials Suite — Document Operations</p>
        </div>
        <Badge variant="outline" className="gap-1"><Shield className="h-3 w-3" /> TSHEPO Enforced</Badge>
      </div>

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="high-risk">High-Risk Queue {hrq && hrq.length > 0 && <Badge variant="destructive" className="ml-1">{hrq.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex gap-3">
                <Input placeholder="Subject ID (CPID/Provider ID)" value={subjectId} onChange={e => setSubjectId(e.target.value)} className="max-w-xs" />
                <Select value={subjectType} onValueChange={setSubjectType}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="CLIENT">Client</SelectItem>
                    <SelectItem value="PROVIDER">Provider</SelectItem>
                    <SelectItem value="FACILITY">Facility</SelectItem>
                    <SelectItem value="ENCOUNTER">Encounter</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={lifecycleFilter} onValueChange={setLifecycleFilter}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="REVOKED">Revoked</SelectItem>
                    <SelectItem value="SUPERSEDED">Superseded</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                    <SelectItem value="DELETED">Deleted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3">
            {isLoading && <p className="text-muted-foreground">Loading...</p>}
            {docs?.map((doc: any) => (
              <Card key={doc.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedDoc(doc)}>
                <CardContent className="pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{doc.document_type_code}</p>
                      <p className="text-sm text-muted-foreground">{doc.subject_type}: {doc.subject_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={confidentialityColor(doc.confidentiality)}>{doc.confidentiality}</Badge>
                    <Badge variant={lifecycleColor(doc.lifecycle_state)}>{doc.lifecycle_state}</Badge>
                    <Badge variant="outline">{doc.storage_provider}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {docs?.length === 0 && <p className="text-center text-muted-foreground py-8">No documents found</p>}
          </div>
        </TabsContent>

        <TabsContent value="high-risk" className="space-y-4">
          {hrq?.map((item: any) => (
            <Card key={item.id}>
              <CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="font-medium">{item.action_type}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{item.reason}</p>
                  <p className="text-xs text-muted-foreground">By: {item.requested_by_actor_id}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => { supabase.from("suite_high_risk_queue").update({ status: "APPROVED", decided_at: new Date().toISOString() }).eq("id", item.id).then(() => qc.invalidateQueries({ queryKey: ["suite-hrq"] })); }}>Approve</Button>
                  <Button size="sm" variant="destructive" onClick={() => { supabase.from("suite_high_risk_queue").update({ status: "REJECTED", decided_at: new Date().toISOString() }).eq("id", item.id).then(() => qc.invalidateQueries({ queryKey: ["suite-hrq"] })); }}>Reject</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {hrq?.length === 0 && <p className="text-center text-muted-foreground py-8">No pending high-risk actions</p>}
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Audit Events {selectedDoc ? `for ${selectedDoc.document_type_code}` : "(select a document)"}</CardTitle></CardHeader>
            <CardContent>
              {auditEvents?.map((evt: any) => (
                <div key={evt.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <Badge variant="outline">{evt.event_type}</Badge>
                    <span className="text-sm ml-2">{evt.actor_id}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(evt.created_at).toLocaleString()}</span>
                </div>
              ))}
              {(!auditEvents || auditEvents.length === 0) && <p className="text-muted-foreground">No audit events</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Document Detail Dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={o => { if (!o) setSelectedDoc(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selectedDoc?.document_type_code}</DialogTitle></DialogHeader>
          {selectedDoc && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">ID:</span> <span className="font-mono text-xs">{selectedDoc.id}</span></div>
                <div><span className="text-muted-foreground">Subject:</span> {selectedDoc.subject_type}/{selectedDoc.subject_id}</div>
                <div><span className="text-muted-foreground">Source:</span> {selectedDoc.source}</div>
                <div><span className="text-muted-foreground">MIME:</span> {selectedDoc.mime_type}</div>
                <div><span className="text-muted-foreground">Storage:</span> {selectedDoc.storage_provider}</div>
                <div><span className="text-muted-foreground">State:</span> <Badge variant={lifecycleColor(selectedDoc.lifecycle_state)}>{selectedDoc.lifecycle_state}</Badge></div>
              </div>
              {selectedDoc.lifecycle_state === "ACTIVE" && (
                <div className="flex gap-2 pt-2">
                  <Textarea placeholder="Reason..." value={actionReason} onChange={e => setActionReason(e.target.value)} className="text-sm" />
                </div>
              )}
              {selectedDoc.lifecycle_state === "ACTIVE" && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { lifecycleMutation.mutate({ id: selectedDoc.id, action: "archive", reason: actionReason }); setSelectedDoc(null); }}><Archive className="h-3 w-3 mr-1" /> Archive</Button>
                  <Button size="sm" variant="outline" onClick={() => { lifecycleMutation.mutate({ id: selectedDoc.id, action: "supersede", reason: actionReason }); setSelectedDoc(null); }}><Link2 className="h-3 w-3 mr-1" /> Supersede</Button>
                  <Button size="sm" variant="destructive" onClick={() => { lifecycleMutation.mutate({ id: selectedDoc.id, action: "revoke", reason: actionReason }); setSelectedDoc(null); }}><Trash2 className="h-3 w-3 mr-1" /> Revoke</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
