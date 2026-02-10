import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Check, X, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function VarapiPrivileges() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [decisionReason, setDecisionReason] = useState("");
  const [filter, setFilter] = useState("PENDING");

  const { data: privileges } = useQuery({
    queryKey: ["varapi_privileges", filter],
    queryFn: async () => {
      let q = (supabase as any).from("varapi_privileges").select("*").order("created_at", { ascending: false });
      if (filter !== "ALL") q = q.eq("status", filter);
      const { data } = await q.limit(100);
      return data || [];
    },
  });

  const { data: approvals } = useQuery({
    queryKey: ["varapi_approvals"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("varapi_privilege_approvals").select("*").order("decided_at", { ascending: false }).limit(50);
      return data || [];
    },
  });

  const decideMut = useMutation({
    mutationFn: async ({ privId, decision }: { privId: string; decision: string }) => {
      await (supabase as any).from("varapi_privilege_approvals").insert({ privilege_id: privId, tenant_id: "default-tenant", decision, decided_by_actor_id: "admin", decision_reason: decisionReason || "No reason provided" });
      await (supabase as any).from("varapi_privileges").update({ status: decision === "APPROVE" ? "APPROVED" : "REVOKED", updated_at: new Date().toISOString() }).eq("id", privId);
    },
    onSuccess: () => {
      toast.success("Decision recorded");
      qc.invalidateQueries({ queryKey: ["varapi_privileges"] });
      qc.invalidateQueries({ queryKey: ["varapi_approvals"] });
      setDecisionReason("");
    },
  });

  const statusColor = (s: string) => ({ PENDING: "bg-yellow-100 text-yellow-800", APPROVED: "bg-green-100 text-green-800", REVOKED: "bg-red-100 text-red-800", EXPIRED: "bg-gray-100 text-gray-600" }[s] || "bg-muted text-muted-foreground");

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}><ArrowLeft className="h-4 w-4" /></Button>
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="h-6 w-6" />VARAPI — Privileges & Approvals</h1><p className="text-muted-foreground text-sm">Grant, approve, revoke provider privileges</p></div>
        </div>

        <div className="flex gap-2">
          {["PENDING", "APPROVED", "REVOKED", "ALL"].map(s => (
            <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)}>{s}</Button>
          ))}
        </div>

        <div className="space-y-3">
          {(privileges || []).map((p: any) => (
            <Card key={p.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-mono text-sm">{p.provider_public_id}</p>
                    <p className="text-sm text-muted-foreground">Facility: {p.facility_id || "—"} | Workspace: {p.workspace_id || "—"}</p>
                    <p className="text-xs text-muted-foreground mt-1">Scope: {JSON.stringify(p.scope_json)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColor(p.status)}>{p.status}</Badge>
                    {p.status === "PENDING" && (
                      <Dialog>
                        <DialogTrigger asChild><Button size="sm">Decide</Button></DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Privilege Decision</DialogTitle></DialogHeader>
                          <div className="space-y-4">
                            <div><Label>Decision Reason (required)</Label><Textarea value={decisionReason} onChange={e => setDecisionReason(e.target.value)} placeholder="Reason for approval or rejection..." /></div>
                            <div className="flex gap-2">
                              <Button className="flex-1" onClick={() => decideMut.mutate({ privId: p.id, decision: "APPROVE" })} disabled={!decisionReason}><Check className="h-4 w-4 mr-1" />Approve</Button>
                              <Button variant="destructive" className="flex-1" onClick={() => decideMut.mutate({ privId: p.id, decision: "REJECT" })} disabled={!decisionReason}><X className="h-4 w-4 mr-1" />Reject</Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {!privileges?.length && <p className="text-muted-foreground text-center py-8">No privileges found</p>}
        </div>

        <Card><CardHeader><CardTitle>Recent Decisions</CardTitle></CardHeader>
          <CardContent>
            {(approvals || []).slice(0, 10).map((a: any) => (
              <div key={a.id} className="flex items-center gap-3 border-b py-2 text-sm">
                <Badge variant={a.decision === "APPROVE" ? "default" : "destructive"}>{a.decision}</Badge>
                <span className="text-muted-foreground">{new Date(a.decided_at).toLocaleString()}</span>
                <span className="text-xs flex-1">{a.decision_reason}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
