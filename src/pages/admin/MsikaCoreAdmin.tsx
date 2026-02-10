/**
 * MSIKA Core v1.1 — Products & Services Registry Admin Console
 */
import React, { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Plus, Search, Upload, CheckCircle, XCircle, Package, Stethoscope, ClipboardList, DollarSign, Building2, UserCheck, Eye, FileJson } from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as sdk from "@/lib/kernel/msika-core/msikaCoreCient";

const KIND_ICONS: Record<string, any> = {
  PRODUCT: Package, SERVICE: Stethoscope, ORDERABLE: ClipboardList,
  CHARGEABLE: DollarSign, CAPABILITY_FACILITY: Building2, CAPABILITY_PROVIDER: UserCheck,
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground", REVIEW: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  APPROVED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  PUBLISHED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export default function MsikaCoreAdmin() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">MSIKA Core</h1>
            <p className="text-sm text-muted-foreground">Products & Services Registry</p>
          </div>
        </div>
      </header>
      <main className="p-6">
        <Tabs defaultValue="catalogs" className="space-y-4">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="catalogs">Catalogs</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="mappings">Mappings</TabsTrigger>
            <TabsTrigger value="packs">Packs</TabsTrigger>
            <TabsTrigger value="intents">Intents</TabsTrigger>
          </TabsList>
          <TabsContent value="catalogs"><CatalogsTab /></TabsContent>
          <TabsContent value="items"><ItemsTab /></TabsContent>
          <TabsContent value="search"><SearchTab /></TabsContent>
          <TabsContent value="import"><ImportTab /></TabsContent>
          <TabsContent value="mappings"><MappingsTab /></TabsContent>
          <TabsContent value="packs"><PacksTab /></TabsContent>
          <TabsContent value="intents"><IntentsTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ── Catalogs Tab ──────────────────────────────
function CatalogsTab() {
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newScope, setNewScope] = useState("TENANT");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sdk.listCatalogs();
    setCatalogs(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!newName) return;
    const { data, ok } = await sdk.createCatalog({ name: newName, scope: newScope });
    if (ok) { toast.success(`Catalog created: ${data?.catalog_id?.slice(0, 8)}`); setShowCreate(false); setNewName(""); load(); }
    else toast.error(data?.error?.message || "Failed");
  };

  const doAction = async (id: string, action: string) => {
    const { data, ok } = await sdk.catalogAction(id, action);
    if (ok) { toast.success(`Catalog ${action.replace("-", " ")}`); load(); }
    else toast.error(data?.error?.message || "Failed");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div><CardTitle>Catalogs</CardTitle><CardDescription>National baseline & tenant overlays</CardDescription></div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Create Catalog</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Catalog</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Name</Label><Input value={newName} onChange={e => setNewName(e.target.value)} /></div>
                <div><Label>Scope</Label>
                  <Select value={newScope} onValueChange={setNewScope}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="NATIONAL">National</SelectItem><SelectItem value="TENANT">Tenant</SelectItem></SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreate} className="w-full">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow>
            <TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Scope</TableHead><TableHead>Version</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {catalogs.map(c => (
              <TableRow key={c.catalog_id}>
                <TableCell className="font-mono text-xs">{c.catalog_id?.slice(0, 10)}…</TableCell>
                <TableCell>{c.name}</TableCell>
                <TableCell><Badge variant="outline">{c.scope}</Badge></TableCell>
                <TableCell>{c.version}</TableCell>
                <TableCell><Badge className={STATUS_COLORS[c.status]}>{c.status}</Badge></TableCell>
                <TableCell className="space-x-1">
                  {c.status === "DRAFT" && <Button size="sm" variant="outline" onClick={() => doAction(c.catalog_id, "submit-review")}>Submit</Button>}
                  {c.status === "REVIEW" && <Button size="sm" variant="outline" onClick={() => doAction(c.catalog_id, "approve")}>Approve</Button>}
                  {c.status === "APPROVED" && <Button size="sm" onClick={() => doAction(c.catalog_id, "publish")}>Publish</Button>}
                </TableCell>
              </TableRow>
            ))}
            {!catalogs.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{loading ? "Loading…" : "No catalogs"}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ── Items Tab ─────────────────────────────────
function ItemsTab() {
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [selectedCatalog, setSelectedCatalog] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newItem, setNewItem] = useState({ kind: "PRODUCT", canonical_code: "", display_name: "", description: "", tags: "" });

  useEffect(() => { sdk.listCatalogs().then(r => setCatalogs(Array.isArray(r.data) ? r.data : [])); }, []);

  useEffect(() => {
    if (!selectedCatalog) return;
    sdk.searchItems({ q: "" }).then(r => {
      const all = Array.isArray(r.data) ? r.data : [];
      setItems(all.filter((i: any) => i.catalog_id === selectedCatalog));
    });
  }, [selectedCatalog]);

  const handleCreate = async () => {
    if (!selectedCatalog || !newItem.canonical_code || !newItem.display_name) return;
    const body: any = { ...newItem, tags: newItem.tags.split(",").map(t => t.trim()).filter(Boolean) };
    const { ok, data } = await sdk.createItem(selectedCatalog, body);
    if (ok) { toast.success("Item created"); setShowCreate(false); setNewItem({ kind: "PRODUCT", canonical_code: "", display_name: "", description: "", tags: "" }); }
    else toast.error(data?.error?.message || "Failed");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div><CardTitle>Catalog Items</CardTitle><CardDescription>Products, Services, Orderables, Chargeables, Capabilities</CardDescription></div>
          <div className="flex gap-2">
            <Select value={selectedCatalog} onValueChange={setSelectedCatalog}>
              <SelectTrigger className="w-[240px]"><SelectValue placeholder="Select catalog" /></SelectTrigger>
              <SelectContent>{catalogs.map(c => <SelectItem key={c.catalog_id} value={c.catalog_id}>{c.name} ({c.status})</SelectItem>)}</SelectContent>
            </Select>
            {selectedCatalog && <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Item</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New Item</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Kind</Label>
                    <Select value={newItem.kind} onValueChange={v => setNewItem(p => ({ ...p, kind: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["PRODUCT","SERVICE","ORDERABLE","CHARGEABLE","CAPABILITY_FACILITY","CAPABILITY_PROVIDER"].map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Code</Label><Input value={newItem.canonical_code} onChange={e => setNewItem(p => ({ ...p, canonical_code: e.target.value }))} /></div>
                  <div><Label>Name</Label><Input value={newItem.display_name} onChange={e => setNewItem(p => ({ ...p, display_name: e.target.value }))} /></div>
                  <div><Label>Description</Label><Textarea value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))} /></div>
                  <div><Label>Tags (comma-separated)</Label><Input value={newItem.tags} onChange={e => setNewItem(p => ({ ...p, tags: e.target.value }))} /></div>
                  <Button onClick={handleCreate} className="w-full">Create</Button>
                </div>
              </DialogContent>
            </Dialog>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow>
            <TableHead>Kind</TableHead><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Tags</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {items.map((item: any) => {
              const Icon = KIND_ICONS[item.kind] || Package;
              return (
                <TableRow key={item.item_id}>
                  <TableCell><div className="flex items-center gap-2"><Icon className="h-4 w-4" /><span className="text-xs">{item.kind}</span></div></TableCell>
                  <TableCell className="font-mono text-xs">{item.canonical_code}</TableCell>
                  <TableCell>{item.display_name}</TableCell>
                  <TableCell>{(item.tags || []).map((t: string) => <Badge key={t} variant="secondary" className="mr-1 text-xs">{t}</Badge>)}</TableCell>
                </TableRow>
              );
            })}
            {!items.length && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">{selectedCatalog ? "No items" : "Select a catalog"}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ── Search Tab ────────────────────────────────
function SearchTab() {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const doSearch = async () => {
    const { data } = await sdk.searchItems({ q: query, kind: kind || undefined });
    setResults(Array.isArray(data) ? data : []);
  };

  return (
    <Card>
      <CardHeader><CardTitle>Search Registry</CardTitle><CardDescription>Full-text search across published catalogs</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder="Search items…" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()} />
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="All kinds" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              {["PRODUCT","SERVICE","ORDERABLE","CHARGEABLE"].map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={doSearch}><Search className="h-4 w-4 mr-2" />Search</Button>
        </div>
        <Table>
          <TableHeader><TableRow><TableHead>Kind</TableHead><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Tags</TableHead></TableRow></TableHeader>
          <TableBody>
            {results.map((r: any) => (
              <TableRow key={r.item_id}>
                <TableCell><Badge variant="outline">{r.kind}</Badge></TableCell>
                <TableCell className="font-mono text-xs">{r.canonical_code}</TableCell>
                <TableCell>{r.display_name}</TableCell>
                <TableCell>{(r.tags || []).map((t: string) => <Badge key={t} variant="secondary" className="mr-1 text-xs">{t}</Badge>)}</TableCell>
              </TableRow>
            ))}
            {!results.length && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No results</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ── Import Tab ────────────────────────────────
function ImportTab() {
  const [csvText, setCsvText] = useState("");
  const [jobResult, setJobResult] = useState<any>(null);

  const handleImport = async () => {
    if (!csvText.trim()) return;
    const lines = csvText.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const vals = line.split(",").map(v => v.trim());
      const obj: any = {};
      headers.forEach((h, i) => obj[h] = vals[i] || "");
      return obj;
    });
    const { data, ok } = await sdk.importCSV(rows);
    if (ok) { toast.success("Import complete"); setJobResult(data); }
    else toast.error(data?.error?.message || "Failed");
  };

  return (
    <Card>
      <CardHeader><CardTitle>CSV Import</CardTitle><CardDescription>Import items from CSV data</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>CSV Data (first row = headers)</Label>
          <Textarea rows={8} placeholder="kind,canonical_code,display_name,strength,form&#10;PRODUCT,AMP-001,Amoxicillin,500mg,Capsule" value={csvText} onChange={e => setCsvText(e.target.value)} className="font-mono text-xs" />
        </div>
        <Button onClick={handleImport}><Upload className="h-4 w-4 mr-2" />Import</Button>
        {jobResult && (
          <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
            <p className="font-medium">Job: {jobResult.job_id?.slice(0, 10)}…</p>
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div>Total: {jobResult.stats?.total}</div>
              <div>Invalid: {jobResult.stats?.invalid}</div>
              <div>Deduped: {jobResult.stats?.deduped}</div>
              <div>Pending: {jobResult.stats?.pending_review}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Mappings Tab ──────────────────────────────
function MappingsTab() {
  const [mappings, setMappings] = useState<any[]>([]);

  const load = useCallback(async () => {
    const { data } = await sdk.listPendingMappings();
    setMappings(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id: string) => {
    const { ok } = await sdk.approveMapping(id);
    if (ok) { toast.success("Mapping approved"); load(); } else toast.error("Failed");
  };

  const handleReject = async (id: string) => {
    const { ok } = await sdk.rejectMapping(id);
    if (ok) { toast.success("Mapping rejected"); load(); } else toast.error("Failed");
  };

  return (
    <Card>
      <CardHeader><CardTitle>Mapping Queue</CardTitle><CardDescription>Pending external-to-internal mappings</CardDescription></CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>External Code</TableHead><TableHead>Internal Item</TableHead><TableHead>Type</TableHead><TableHead>Confidence</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {mappings.map((m: any) => (
              <TableRow key={m.id}>
                <TableCell className="font-mono text-xs">{m.external_code}</TableCell>
                <TableCell className="font-mono text-xs">{m.internal_item_id?.slice(0, 10)}…</TableCell>
                <TableCell><Badge variant="outline">{m.map_type}</Badge></TableCell>
                <TableCell>{(m.confidence * 100).toFixed(0)}%</TableCell>
                <TableCell className="space-x-1">
                  <Button size="sm" variant="outline" onClick={() => handleApprove(m.id)}><CheckCircle className="h-3 w-3 mr-1" />Approve</Button>
                  <Button size="sm" variant="ghost" onClick={() => handleReject(m.id)}><XCircle className="h-3 w-3 mr-1" />Reject</Button>
                </TableCell>
              </TableRow>
            ))}
            {!mappings.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No pending mappings</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ── Packs Tab ─────────────────────────────────
function PacksTab() {
  const [packType, setPackType] = useState("item-master");
  const [packData, setPackData] = useState<any>(null);

  const loadPack = async () => {
    const { data, etag } = await sdk.getPack(packType);
    setPackData({ ...data, etag });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Packs Viewer</CardTitle><CardDescription>Consumer integration contract packs</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Select value={packType} onValueChange={setPackType}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="item-master">Item Master</SelectItem>
              <SelectItem value="orderables">Orderables</SelectItem>
              <SelectItem value="chargeables">Chargeables</SelectItem>
              <SelectItem value="capabilities/facility">Facility Capabilities</SelectItem>
              <SelectItem value="capabilities/provider">Provider Capabilities</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadPack}><FileJson className="h-4 w-4 mr-2" />Load Pack</Button>
        </div>
        {packData && (
          <div className="space-y-2">
            <div className="flex gap-4 text-sm">
              <span>Pack: <Badge variant="outline">{packData.pack}</Badge></span>
              <span>Items: <strong>{packData.items?.length || 0}</strong></span>
              {packData.etag && <span>ETag: <code className="text-xs">{packData.etag}</code></span>}
              {packData.checksum && <span>Checksum: <code className="text-xs">{packData.checksum?.slice(0, 16)}…</code></span>}
            </div>
            <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-96">{JSON.stringify(packData, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Intents Tab ───────────────────────────────
function IntentsTab() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || "";
      const anonKey = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY || "";
      // Direct query via REST for intents schema
      const resp = await fetch(`${supabaseUrl}/rest/v1/event_log?order=created_at.desc&limit=50`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, Accept: "application/json", "Accept-Profile": "intents" },
      });
      if (resp.ok) setEvents(await resp.json());
    };
    load();
  }, []);

  return (
    <Card>
      <CardHeader><CardTitle>Integration Intents</CardTitle><CardDescription>Event log (prototype Kafka substitute)</CardDescription></CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Event</TableHead><TableHead>Entity</TableHead><TableHead>Correlation</TableHead></TableRow></TableHeader>
          <TableBody>
            {events.map((e: any) => (
              <TableRow key={e.id}>
                <TableCell className="text-xs">{new Date(e.created_at).toLocaleString()}</TableCell>
                <TableCell><Badge variant="outline">{e.event_type}</Badge></TableCell>
                <TableCell className="text-xs">{e.entity_type}/{e.entity_id?.slice(0, 10)}…</TableCell>
                <TableCell className="font-mono text-xs">{e.correlation_id?.slice(0, 8)}…</TableCell>
              </TableRow>
            ))}
            {!events.length && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No events yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
