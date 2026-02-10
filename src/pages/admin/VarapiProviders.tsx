import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, Search, Shield, User, FileText, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function VarapiProviders() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newProvider, setNewProvider] = useState({ cadre_code: "", given_name: "", family_name: "" });

  const { data: providers, isLoading } = useQuery({
    queryKey: ["varapi_providers", statusFilter],
    queryFn: async () => {
      let q = (supabase as any).from("varapi_providers").select("*").order("created_at", { ascending: false });
      if (statusFilter !== "ALL") q = q.eq("status", statusFilter);
      const { data } = await q.limit(100);
      return data || [];
    },
  });

  const { data: licenses } = useQuery({
    queryKey: ["varapi_licenses", selectedProvider?.provider_public_id],
    queryFn: async () => {
      if (!selectedProvider) return [];
      const { data } = await (supabase as any).from("varapi_licenses").select("*").eq("provider_public_id", selectedProvider.provider_public_id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!selectedProvider,
  });

  const { data: licenseEvents } = useQuery({
    queryKey: ["varapi_license_events", selectedProvider?.provider_public_id],
    queryFn: async () => {
      if (!selectedProvider || !licenses?.length) return [];
      const ids = licenses.map((l: any) => l.id);
      const { data } = await (supabase as any).from("varapi_license_events").select("*").in("license_id", ids).order("event_at", { ascending: false });
      return data || [];
    },
    enabled: !!selectedProvider && !!licenses?.length,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const publicId = Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 10).toUpperCase();
      await (supabase as any).from("varapi_providers").insert({
        provider_public_id: publicId,
        tenant_id: "default-tenant",
        status: "PENDING",
        cadre_code: newProvider.cadre_code,
        profile_json: { given_name: newProvider.given_name, family_name: newProvider.family_name },
      });
      return publicId;
    },
    onSuccess: (id) => {
      toast.success(`Provider ${id} created`);
      qc.invalidateQueries({ queryKey: ["varapi_providers"] });
      setShowCreate(false);
    },
  });

  const filtered = (providers || []).filter((p: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return p.provider_public_id.toLowerCase().includes(s) || JSON.stringify(p.profile_json).toLowerCase().includes(s) || (p.cadre_code || "").toLowerCase().includes(s);
  });

  const statusColor = (s: string) => {
    const map: Record<string, string> = { ACTIVE: "bg-green-100 text-green-800", PENDING: "bg-yellow-100 text-yellow-800", SUSPENDED: "bg-red-100 text-red-800", RETIRED: "bg-gray-100 text-gray-600", DECEASED: "bg-gray-200 text-gray-700" };
    return map[s] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">VARAPI — Provider Registry</h1>
            <p className="text-muted-foreground text-sm">Provider search, profile, license status + history</p>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search providers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
              <SelectItem value="RETIRED">Retired</SelectItem>
              <SelectItem value="DECEASED">Deceased</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Register Provider</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Register New Provider</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Given Name</Label><Input value={newProvider.given_name} onChange={e => setNewProvider(p => ({ ...p, given_name: e.target.value }))} /></div>
                <div><Label>Family Name</Label><Input value={newProvider.family_name} onChange={e => setNewProvider(p => ({ ...p, family_name: e.target.value }))} /></div>
                <div><Label>Cadre Code</Label>
                  <Select value={newProvider.cadre_code} onValueChange={v => setNewProvider(p => ({ ...p, cadre_code: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select cadre" /></SelectTrigger>
                    <SelectContent>
                      {["DOCTOR","NURSE","PHARMACIST","PHYSIO","DENTIST","MIDWIFE","CHW"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-2 max-h-[70vh] overflow-auto">
            {isLoading && <p className="text-muted-foreground text-sm">Loading...</p>}
            {filtered.map((p: any) => (
              <Card key={p.provider_public_id} className={`cursor-pointer hover:border-primary transition-colors ${selectedProvider?.provider_public_id === p.provider_public_id ? "border-primary" : ""}`} onClick={() => setSelectedProvider(p)}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">{p.provider_public_id}</p>
                      <p className="font-medium">{p.profile_json?.given_name || ""} {p.profile_json?.family_name || ""}</p>
                      <p className="text-sm text-muted-foreground">{p.cadre_code || "—"}</p>
                    </div>
                    <Badge className={statusColor(p.status)}>{p.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!isLoading && filtered.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No providers found</p>}
          </div>

          <div className="lg:col-span-2">
            {selectedProvider ? (
              <Tabs defaultValue="profile">
                <TabsList><TabsTrigger value="profile"><User className="h-4 w-4 mr-1" />Profile</TabsTrigger><TabsTrigger value="licenses"><Shield className="h-4 w-4 mr-1" />Licenses</TabsTrigger><TabsTrigger value="history"><Clock className="h-4 w-4 mr-1" />History</TabsTrigger></TabsList>
                <TabsContent value="profile">
                  <Card><CardHeader><CardTitle>Provider Profile</CardTitle><CardDescription>{selectedProvider.provider_public_id}</CardDescription></CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-muted-foreground">Status:</span> <Badge className={statusColor(selectedProvider.status)}>{selectedProvider.status}</Badge></div>
                        <div><span className="text-muted-foreground">Cadre:</span> {selectedProvider.cadre_code || "—"}</div>
                        <div><span className="text-muted-foreground">Created:</span> {new Date(selectedProvider.created_at).toLocaleDateString()}</div>
                      </div>
                      <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-60">{JSON.stringify(selectedProvider.profile_json, null, 2)}</pre>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="licenses">
                  <Card><CardHeader><CardTitle>Licenses</CardTitle></CardHeader>
                    <CardContent>
                      {licenses?.length ? licenses.map((l: any) => (
                        <div key={l.id} className="border rounded p-3 mb-2">
                          <div className="flex justify-between"><Badge>{l.license_status}</Badge><span className="text-xs text-muted-foreground">{l.valid_from?.slice(0, 10)} → {l.valid_to?.slice(0, 10) || "∞"}</span></div>
                          {l.notes && <p className="text-sm text-muted-foreground mt-1">{l.notes}</p>}
                        </div>
                      )) : <p className="text-muted-foreground text-sm">No licenses recorded</p>}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="history">
                  <Card><CardHeader><CardTitle>License Event History</CardTitle></CardHeader>
                    <CardContent>
                      {licenseEvents?.length ? licenseEvents.map((e: any) => (
                        <div key={e.id} className="flex items-center gap-3 border-b py-2 text-sm">
                          <Badge variant="outline">{e.event_type}</Badge>
                          <span className="text-muted-foreground">{new Date(e.event_at).toLocaleString()}</span>
                          <span className="text-xs">by {e.actor_id}</span>
                        </div>
                      )) : <p className="text-muted-foreground text-sm">No events</p>}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="h-full flex items-center justify-center"><CardContent><p className="text-muted-foreground">Select a provider to view details</p></CardContent></Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
