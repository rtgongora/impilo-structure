import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, Building2, Upload, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function VarapiCouncils() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newCouncil, setNewCouncil] = useState({ name: "", council_type_code: "", mode: "SOR" });

  const { data: councils } = useQuery({
    queryKey: ["varapi_councils"],
    queryFn: async () => { const { data } = await (supabase as any).from("varapi_councils").select("*").order("created_at", { ascending: false }); return data || []; },
  });

  const { data: importRuns } = useQuery({
    queryKey: ["varapi_import_runs"],
    queryFn: async () => { const { data } = await (supabase as any).from("varapi_import_runs").select("*").order("created_at", { ascending: false }).limit(20); return data || []; },
  });

  const { data: reconciliation } = useQuery({
    queryKey: ["varapi_reconciliation"],
    queryFn: async () => { const { data } = await (supabase as any).from("varapi_reconciliation_cases").select("*").eq("status", "OPEN").order("created_at", { ascending: false }); return data || []; },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      await (supabase as any).from("varapi_councils").insert({ tenant_id: "default-tenant", ...newCouncil });
    },
    onSuccess: () => { toast.success("Council created"); qc.invalidateQueries({ queryKey: ["varapi_councils"] }); setShowCreate(false); },
  });

  const modeColor = (m: string) => ({ SOR: "bg-blue-100 text-blue-800", EXTERNAL_SYNC: "bg-purple-100 text-purple-800", ORG_HR: "bg-orange-100 text-orange-800" }[m] || "bg-muted text-muted-foreground");

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}><ArrowLeft className="h-4 w-4" /></Button>
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="h-6 w-6" />VARAPI — Councils & Imports</h1><p className="text-muted-foreground text-sm">Council config, import runs, reconciliation queue</p></div>
        </div>

        <Tabs defaultValue="councils">
          <TabsList><TabsTrigger value="councils">Councils</TabsTrigger><TabsTrigger value="imports">Import Runs</TabsTrigger><TabsTrigger value="reconciliation">Reconciliation</TabsTrigger></TabsList>
          <TabsContent value="councils" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Create Council</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create Council</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div><Label>Name</Label><Input value={newCouncil.name} onChange={e => setNewCouncil(c => ({ ...c, name: e.target.value }))} /></div>
                    <div><Label>Type Code</Label>
                      <Select value={newCouncil.council_type_code} onValueChange={v => setNewCouncil(c => ({ ...c, council_type_code: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent><SelectItem value="HPCZ">HPCZ</SelectItem><SelectItem value="GNC">GNC</SelectItem><SelectItem value="PCZ">PCZ</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div><Label>Mode</Label>
                      <Select value={newCouncil.mode} onValueChange={v => setNewCouncil(c => ({ ...c, mode: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="SOR">System of Record</SelectItem><SelectItem value="EXTERNAL_SYNC">External Sync</SelectItem><SelectItem value="ORG_HR">Org HR</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <Button onClick={() => createMut.mutate()} disabled={!newCouncil.name}>Create</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {(councils || []).map((c: any) => (
              <Card key={c.id}><CardContent className="p-4 flex justify-between items-center">
                <div><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.council_type_code || "—"} • {c.id.slice(0, 8)}</p></div>
                <Badge className={modeColor(c.mode)}>{c.mode}</Badge>
              </CardContent></Card>
            ))}
          </TabsContent>
          <TabsContent value="imports" className="space-y-4">
            {(importRuns || []).map((r: any) => (
              <Card key={r.id}><CardContent className="p-4">
                <div className="flex justify-between"><div><p className="text-sm font-medium">{r.source_type} import</p><p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p></div>
                  <Badge variant={r.status === "DONE" ? "default" : r.status === "FAILED" ? "destructive" : "secondary"}>{r.status}</Badge></div>
              </CardContent></Card>
            ))}
            {!importRuns?.length && <p className="text-muted-foreground text-center py-8">No import runs</p>}
          </TabsContent>
          <TabsContent value="reconciliation" className="space-y-4">
            {(reconciliation || []).map((c: any) => (
              <Card key={c.case_id}><CardContent className="p-4">
                <div className="flex justify-between items-start"><div><Badge variant="outline"><AlertTriangle className="h-3 w-3 mr-1" />{c.case_type}</Badge><p className="text-xs text-muted-foreground mt-1">{new Date(c.created_at).toLocaleString()}</p></div>
                  <Badge>{c.status}</Badge></div>
                <pre className="bg-muted p-2 rounded text-xs mt-2 max-h-20 overflow-auto">{JSON.stringify(c.payload_json, null, 2)}</pre>
              </CardContent></Card>
            ))}
            {!reconciliation?.length && <p className="text-muted-foreground text-center py-8">No open cases</p>}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
