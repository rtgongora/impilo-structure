import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Package, ScanBarcode, ArrowLeftRight, Activity, ClipboardCheck, Truck, RotateCcw, Warehouse, HandMetal, FileText } from "lucide-react";
import { inventoryClient } from "@/lib/kernel/inventory/inventoryClient";

export default function InventoryAdmin() {
  return (
    <AppLayout title="Inventory & Supply Chain v1.1">
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="dashboard"><Warehouse className="w-4 h-4 mr-1" />Dashboard</TabsTrigger>
          <TabsTrigger value="movements"><ArrowLeftRight className="w-4 h-4 mr-1" />Movements</TabsTrigger>
          <TabsTrigger value="fefo"><ScanBarcode className="w-4 h-4 mr-1" />FEFO Picker</TabsTrigger>
          <TabsTrigger value="counts"><ClipboardCheck className="w-4 h-4 mr-1" />Stock Counts</TabsTrigger>
          <TabsTrigger value="requisitions"><FileText className="w-4 h-4 mr-1" />Requisitions</TabsTrigger>
          <TabsTrigger value="handover"><HandMetal className="w-4 h-4 mr-1" />Handover</TabsTrigger>
          <TabsTrigger value="reconcile"><RotateCcw className="w-4 h-4 mr-1" />Reconciliation</TabsTrigger>
          <TabsTrigger value="events"><Activity className="w-4 h-4 mr-1" />Events</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard"><DashboardTab /></TabsContent>
        <TabsContent value="movements"><MovementsTab /></TabsContent>
        <TabsContent value="fefo"><FefoTab /></TabsContent>
        <TabsContent value="counts"><CountsTab /></TabsContent>
        <TabsContent value="requisitions"><RequisitionsTab /></TabsContent>
        <TabsContent value="handover"><HandoverTab /></TabsContent>
        <TabsContent value="reconcile"><ReconcileTab /></TabsContent>
        <TabsContent value="events"><EventsTab /></TabsContent>
      </Tabs>
    </AppLayout>
  );
}

// ========== Dashboard Tab ==========
function DashboardTab() {
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await inventoryClient.getOnHand({});
      setPositions(res.positions || []);
    } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>On-Hand Positions</CardTitle>
        <CardDescription>Current stock levels across all facilities/stores</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={refresh} disabled={loading}>{loading ? "Loading..." : "Refresh On-Hand"}</Button>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Facility</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Bin</TableHead>
              <TableHead>Item Code</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead className="text-right">Qty</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.map((p, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-xs">{p.facility_id}</TableCell>
                <TableCell>{p.store_id}</TableCell>
                <TableCell>{p.bin_id || "—"}</TableCell>
                <TableCell className="font-mono">{p.item_code}</TableCell>
                <TableCell>{p.batch || "—"}</TableCell>
                <TableCell>{p.expiry || "—"}</TableCell>
                <TableCell className="text-right font-semibold">
                  <Badge variant={p.qty_on_hand <= 0 ? "destructive" : "secondary"}>{p.qty_on_hand}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {positions.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No data</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ========== Movements Tab ==========
function MovementsTab() {
  const [type, setType] = useState("receipt");
  const [form, setForm] = useState<any>({ store_id: "", item_code: "", qty: 0, batch: "", expiry: "", reason: "" });
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const fn = (inventoryClient as any)[type === "return" ? "returnStock" : type];
      if (!fn) { toast.error("Invalid type"); return; }
      const res = await fn({ ...form, qty: Number(form.qty) });
      if (res.code) { toast.error(res.message); } else { toast.success(`${type} recorded (mode: ${res.mode})`); }
    } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  };

  const loadHistory = async () => {
    const res = await inventoryClient.getLedgerHistory({});
    setHistory(res.events || []);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Record Movement</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["receipt","issue","transfer","adjust","wastage","return"].map(t => <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Store ID</Label><Input value={form.store_id} onChange={e => setForm({...form, store_id: e.target.value})} /></div>
            <div><Label>Item Code</Label><Input value={form.item_code} onChange={e => setForm({...form, item_code: e.target.value})} /></div>
            <div><Label>Quantity</Label><Input type="number" value={form.qty} onChange={e => setForm({...form, qty: e.target.value})} /></div>
            <div><Label>Batch</Label><Input value={form.batch} onChange={e => setForm({...form, batch: e.target.value})} placeholder="Optional" /></div>
            <div><Label>Expiry</Label><Input type="date" value={form.expiry} onChange={e => setForm({...form, expiry: e.target.value})} /></div>
          </div>
          <div><Label>Reason</Label><Input value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} /></div>
          {type === "transfer" && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>To Store ID</Label><Input value={form.to_store_id || ""} onChange={e => setForm({...form, to_store_id: e.target.value})} /></div>
              <div><Label>To Bin ID</Label><Input value={form.to_bin_id || ""} onChange={e => setForm({...form, to_bin_id: e.target.value})} placeholder="Optional" /></div>
            </div>
          )}
          <Button onClick={submit} disabled={loading}>{loading ? "Recording..." : "Record Movement"}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Movement History</CardTitle></CardHeader>
        <CardContent>
          <Button variant="outline" onClick={loadHistory} className="mb-3">Load History</Button>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Qty Δ</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.slice(0, 50).map((e, i) => (
                <TableRow key={i}>
                  <TableCell><Badge variant="outline">{e.event_type}</Badge></TableCell>
                  <TableCell className="font-mono">{e.item_code}</TableCell>
                  <TableCell className={e.qty_delta < 0 ? "text-destructive" : "text-green-600"}>{e.qty_delta}</TableCell>
                  <TableCell>{e.batch || "—"}</TableCell>
                  <TableCell>{e.store_id}</TableCell>
                  <TableCell>{e.reason || "—"}</TableCell>
                  <TableCell className="text-xs">{new Date(e.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ========== FEFO Tab ==========
function FefoTab() {
  const [form, setForm] = useState({ store_id: "", item_code: "", qty_required: 0, barcode: "" });
  const [result, setResult] = useState<any>(null);

  const suggest = async () => {
    try {
      const res = await inventoryClient.fefoSuggest({ store_id: form.store_id, item_code: form.item_code, qty_required: Number(form.qty_required), ...(form.barcode ? { barcode: form.barcode } : {}) });
      setResult(res);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <Card>
      <CardHeader><CardTitle>FEFO Pick Suggestions</CardTitle><CardDescription>First Expired First Out picking with optional barcode validation</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-3">
          <div><Label>Store ID</Label><Input value={form.store_id} onChange={e => setForm({...form, store_id: e.target.value})} /></div>
          <div><Label>Item Code</Label><Input value={form.item_code} onChange={e => setForm({...form, item_code: e.target.value})} /></div>
          <div><Label>Qty Required</Label><Input type="number" value={form.qty_required} onChange={e => setForm({...form, qty_required: Number(e.target.value)})} /></div>
          <div><Label>Barcode (optional)</Label><Input value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} placeholder="Scan to validate" /></div>
        </div>
        <Button onClick={suggest}>Get FEFO Suggestions</Button>
        {result && (
          <div className="space-y-2">
            {result.scan_valid !== undefined && (
              <Badge variant={result.scan_valid ? "default" : "destructive"}>{result.scan_valid ? "✓ Scan Valid" : "✗ Scan Invalid"}</Badge>
            )}
            {result.remaining > 0 && <Badge variant="destructive">Shortfall: {result.remaining}</Badge>}
            <Table>
              <TableHeader><TableRow><TableHead>Batch</TableHead><TableHead>Expiry</TableHead><TableHead>Available</TableHead><TableHead>Pick Qty</TableHead></TableRow></TableHeader>
              <TableBody>
                {(result.picks || []).map((p: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>{p.batch || "—"}</TableCell>
                    <TableCell>{p.expiry || "—"}</TableCell>
                    <TableCell>{p.qty_on_hand}</TableCell>
                    <TableCell className="font-semibold">{p.pick_qty}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ========== Counts Tab ==========
function CountsTab() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [newCount, setNewCount] = useState({ store_id: "" });

  const load = async () => { const r = await inventoryClient.listCounts(); setSessions(r.sessions || []); };
  const create = async () => {
    const res = await inventoryClient.createCount({ store_id: newCount.store_id });
    if (res.code) { toast.error(res.message); } else { toast.success(`Count ${res.session_id} created`); load(); }
  };
  const submitCount = async (id: string) => { await inventoryClient.submitCount(id); toast.success("Submitted"); load(); };
  const approveCount = async (id: string) => {
    const res = await inventoryClient.approveCount(id);
    if (res.code === "STEP_UP_REQUIRED") { toast.error("Step-up required"); } else { toast.success(`Approved — ${res.variances?.length || 0} variances`); load(); }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Stock Count Sessions</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder="Store ID" value={newCount.store_id} onChange={e => setNewCount({ store_id: e.target.value })} className="max-w-xs" />
          <Button onClick={create}>Create Count</Button>
          <Button variant="outline" onClick={load}>Refresh</Button>
        </div>
        <Table>
          <TableHeader><TableRow><TableHead>Session ID</TableHead><TableHead>Store</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {sessions.map((s, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-xs">{s.session_id}</TableCell>
                <TableCell>{s.store_id}</TableCell>
                <TableCell><Badge variant="outline">{s.status}</Badge></TableCell>
                <TableCell className="text-xs">{new Date(s.created_at).toLocaleString()}</TableCell>
                <TableCell className="space-x-1">
                  {s.status === "DRAFT" && <Button size="sm" variant="outline" onClick={() => submitCount(s.session_id)}>Submit</Button>}
                  {s.status === "SUBMITTED" && <Button size="sm" onClick={() => approveCount(s.session_id)}>Approve</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ========== Requisitions Tab ==========
function RequisitionsTab() {
  const [reqs, setReqs] = useState<any[]>([]);
  const [form, setForm] = useState({ from_store_id: "", to_store_id: "" });

  const load = async () => { const r = await inventoryClient.listRequisitions(); setReqs(r.requisitions || []); };
  const create = async () => {
    const res = await inventoryClient.createRequisition({ from_store_id: form.from_store_id, to_store_id: form.to_store_id });
    if (res.code) { toast.error(res.message); } else { toast.success(`Requisition ${res.req_id} created`); load(); }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Requisitions</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder="From Store (requesting)" value={form.from_store_id} onChange={e => setForm({...form, from_store_id: e.target.value})} className="max-w-xs" />
          <Input placeholder="To Store (fulfilling)" value={form.to_store_id} onChange={e => setForm({...form, to_store_id: e.target.value})} className="max-w-xs" />
          <Button onClick={create}>Create</Button>
          <Button variant="outline" onClick={load}>Refresh</Button>
        </div>
        <Table>
          <TableHeader><TableRow><TableHead>Req ID</TableHead><TableHead>From → To</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {reqs.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-xs">{r.req_id}</TableCell>
                <TableCell>{r.from_store_id} → {r.to_store_id}</TableCell>
                <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                <TableCell className="text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                <TableCell className="space-x-1">
                  {r.status === "DRAFT" && <Button size="sm" variant="outline" onClick={async () => { await inventoryClient.approveRequisition(r.req_id); toast.success("Approved"); load(); }}>Approve</Button>}
                  {r.status === "APPROVED" && <Button size="sm" onClick={async () => { await inventoryClient.fulfillRequisition(r.req_id); toast.success("Fulfilled"); load(); }}>Fulfill</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ========== Handover Tab ==========
function HandoverTab() {
  const [handovers, setHandovers] = useState<any[]>([]);
  const [form, setForm] = useState({ store_id: "", to_actor_id: "" });

  const load = async () => { const r = await inventoryClient.listHandovers(); setHandovers(r.handovers || []); };
  const start = async () => {
    const res = await inventoryClient.startHandover({ store_id: form.store_id, to_actor_id: form.to_actor_id });
    if (res.code) { toast.error(res.message); } else { toast.success(`Handover ${res.handover_id} started`); load(); }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Handovers</CardTitle><CardDescription>Two-signature custody transfer</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder="Store ID" value={form.store_id} onChange={e => setForm({...form, store_id: e.target.value})} className="max-w-xs" />
          <Input placeholder="To Actor ID" value={form.to_actor_id} onChange={e => setForm({...form, to_actor_id: e.target.value})} className="max-w-xs" />
          <Button onClick={start}>Start Handover</Button>
          <Button variant="outline" onClick={load}>Refresh</Button>
        </div>
        <Table>
          <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>From → To</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {handovers.map((h, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-xs">{h.handover_id}</TableCell>
                <TableCell>{h.from_actor_id} → {h.to_actor_id}</TableCell>
                <TableCell><Badge variant={h.status === "COMPLETE" ? "default" : "outline"}>{h.status}</Badge></TableCell>
                <TableCell className="text-xs">{new Date(h.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  {(h.status === "STARTED" || h.status === "SIGNED_OUTGOING") && (
                    <Button size="sm" onClick={async () => { await inventoryClient.signHandover(h.handover_id); toast.success("Signed"); load(); }}>
                      {h.status === "STARTED" ? "Sign Outgoing" : "Sign Incoming"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ========== Reconcile Tab ==========
function ReconcileTab() {
  const [items, setItems] = useState<any[]>([]);

  const load = async () => { const r = await inventoryClient.getPendingReconcile(); setItems(r.items || []); };

  return (
    <Card>
      <CardHeader><CardTitle>Reconciliation Queue</CardTitle><CardDescription>Hybrid-mode stock drift resolution (step-up required)</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <Button variant="outline" onClick={load}>Load Pending</Button>
        <Table>
          <TableHeader><TableRow><TableHead>Rec ID</TableHead><TableHead>Facility</TableHead><TableHead>Confidence</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {items.map((item, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-xs">{item.rec_id}</TableCell>
                <TableCell>{item.facility_id}</TableCell>
                <TableCell><Badge variant={item.confidence > 0.8 ? "default" : "destructive"}>{(item.confidence * 100).toFixed(0)}%</Badge></TableCell>
                <TableCell><Badge variant="outline">{item.status}</Badge></TableCell>
                <TableCell>
                  <Button size="sm" variant="destructive" onClick={async () => {
                    const res = await inventoryClient.resolveReconcile(item.rec_id);
                    if (res.code === "STEP_UP_REQUIRED") toast.error("Step-up authentication required");
                    else { toast.success("Resolved"); load(); }
                  }}>Resolve</Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No pending items</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ========== Events Tab ==========
function EventsTab() {
  const [events, setEvents] = useState<any[]>([]);

  const load = async () => { const r = await inventoryClient.getEvents(); setEvents(r.events || []); };

  return (
    <Card>
      <CardHeader><CardTitle>Integration Events / Intents</CardTitle><CardDescription>What would be Kafka events in production</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <Button variant="outline" onClick={load}>Load Events</Button>
        <Table>
          <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Entity</TableHead><TableHead>Entity ID</TableHead><TableHead>Correlation</TableHead><TableHead>Time</TableHead></TableRow></TableHeader>
          <TableBody>
            {events.map((e, i) => (
              <TableRow key={i}>
                <TableCell><Badge variant="outline">{e.event_type}</Badge></TableCell>
                <TableCell>{e.entity_type}</TableCell>
                <TableCell className="font-mono text-xs">{e.entity_id}</TableCell>
                <TableCell className="font-mono text-xs">{e.correlation_id?.slice(0, 8)}</TableCell>
                <TableCell className="text-xs">{new Date(e.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
