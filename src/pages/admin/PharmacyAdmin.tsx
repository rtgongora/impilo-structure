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
import { Pill, Package, ScanBarcode, ArrowLeftRight, ShieldCheck, Activity, Truck, AlertTriangle, RotateCcw } from "lucide-react";
import { pharmacyClient } from "@/lib/kernel/pharmacy/pharmacyClient";

const priorityColor = (p: string) => p === "STAT" ? "destructive" : p === "URGENT" ? "default" : "secondary";
const statusColor = (s: string) => {
  if (["DISPENSED_COMPLETE"].includes(s)) return "default";
  if (["REVERSED","CANCELLED"].includes(s)) return "destructive";
  if (["DISPENSED_PARTIAL","PICKING","BACKORDERED"].includes(s)) return "secondary";
  return "outline";
};

export default function PharmacyAdmin() {
  return (
    <AppLayout title="Pharmacy Service v1.1">
      <Tabs defaultValue="worklist" className="flex-1 flex flex-col min-h-0 p-4">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="worklist"><Pill className="w-4 h-4 mr-1" />Dispense Worklist</TabsTrigger>
          <TabsTrigger value="stock"><Package className="w-4 h-4 mr-1" />Stock</TabsTrigger>
          <TabsTrigger value="reconcile"><ArrowLeftRight className="w-4 h-4 mr-1" />Reconciliation</TabsTrigger>
          <TabsTrigger value="events"><Activity className="w-4 h-4 mr-1" />Events/Intents</TabsTrigger>
          <TabsTrigger value="simulate"><Truck className="w-4 h-4 mr-1" />Simulate</TabsTrigger>
        </TabsList>

        <TabsContent value="worklist"><WorklistTab /></TabsContent>
        <TabsContent value="stock"><StockTab /></TabsContent>
        <TabsContent value="reconcile"><ReconcileTab /></TabsContent>
        <TabsContent value="events"><EventsTab /></TabsContent>
        <TabsContent value="simulate"><SimulateTab /></TabsContent>
      </Tabs>
    </AppLayout>
  );
}

function WorklistTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchWorklist = async () => {
    setLoading(true);
    try {
      const res = await pharmacyClient.getWorklist({});
      setOrders(res.orders || []);
    } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  };

  const viewDetail = async (id: string) => {
    const res = await pharmacyClient.getOrder(id);
    setSelectedOrder(res);
    setDetailOpen(true);
  };

  const acceptOrder = async (id: string) => {
    await pharmacyClient.acceptOrder(id);
    toast.success("Order accepted");
    fetchWorklist();
  };

  const pickOrder = async (id: string) => {
    const res = await pharmacyClient.pickOrder(id);
    toast.success(`FEFO suggestions: ${res.suggestions?.length || 0} items`);
    fetchWorklist();
  };

  const completeOrder = async (id: string) => {
    // Simplified: complete all items with qty=requested
    const detail = await pharmacyClient.getOrder(id);
    const items = (detail.items || []).map((it: any) => ({
      dispense_item_id: it.dispense_item_id, qty_dispensed: it.qty_requested, store_id: "MAIN", bin_id: "DEFAULT",
    }));
    await pharmacyClient.completeDispense(id, items);
    toast.success("Dispense completed — intents emitted to OROS/MusheX/PCT");
    fetchWorklist();
  };

  const createPickupProof = async (id: string) => {
    const res = await pharmacyClient.createPickupProof(id, { method: "OTP" });
    if (res.token) toast.success(`Pickup OTP: ${res.token} (expires ${new Date(res.expires_at).toLocaleTimeString()})`);
    else toast.error("Failed to create proof");
  };

  const reverseOrder = async (id: string) => {
    const res = await pharmacyClient.reverseDispense(id, "Testing reversal");
    if (res.code === "STEP_UP_REQUIRED") toast.error("Step-up required for reversal (simulated with HIGH assurance header)");
    else toast.success("Dispense reversed — credit intents emitted");
    fetchWorklist();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Dispense Worklist</CardTitle>
            <CardDescription>Active pharmacy dispense orders</CardDescription>
          </div>
          <Button onClick={fetchWorklist} disabled={loading}>{loading ? "Loading..." : "Refresh"}</Button>
        </div>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders. Use Simulate tab to create one or click Refresh.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Patient CPID</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o: any) => (
                <TableRow key={o.dispense_order_id}>
                  <TableCell className="font-mono text-xs">{o.dispense_order_id?.substring(0, 20)}…</TableCell>
                  <TableCell className="font-mono text-xs">{o.patient_cpid}</TableCell>
                  <TableCell><Badge variant={priorityColor(o.priority)}>{o.priority}</Badge></TableCell>
                  <TableCell><Badge variant={statusColor(o.status)}>{o.status}</Badge></TableCell>
                  <TableCell className="text-xs">{new Date(o.created_at).toLocaleString()}</TableCell>
                  <TableCell className="space-x-1">
                    <Button size="sm" variant="outline" onClick={() => viewDetail(o.dispense_order_id)}>Detail</Button>
                    {o.status === "NEW" && <Button size="sm" onClick={() => acceptOrder(o.dispense_order_id)}>Accept</Button>}
                    {o.status === "ACCEPTED" && <Button size="sm" onClick={() => pickOrder(o.dispense_order_id)}>Pick</Button>}
                    {["PICKING","ACCEPTED"].includes(o.status) && <Button size="sm" variant="default" onClick={() => completeOrder(o.dispense_order_id)}>Complete</Button>}
                    {["DISPENSED_COMPLETE","DISPENSED_PARTIAL"].includes(o.status) && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => createPickupProof(o.dispense_order_id)}><ShieldCheck className="w-3 h-3 mr-1" />Pickup</Button>
                        <Button size="sm" variant="destructive" onClick={() => reverseOrder(o.dispense_order_id)}><RotateCcw className="w-3 h-3 mr-1" />Reverse</Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Detail</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>ID:</strong> {selectedOrder.dispense_order_id}</div>
                  <div><strong>OROS Ref:</strong> {selectedOrder.oros_order_id}</div>
                  <div><strong>Patient:</strong> {selectedOrder.patient_cpid}</div>
                  <div><strong>Status:</strong> <Badge variant={statusColor(selectedOrder.status)}>{selectedOrder.status}</Badge></div>
                  <div><strong>Priority:</strong> <Badge variant={priorityColor(selectedOrder.priority)}>{selectedOrder.priority}</Badge></div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Items ({selectedOrder.items?.length || 0})</h4>
                  <Table>
                    <TableHeader><TableRow><TableHead>Drug</TableHead><TableHead>Requested</TableHead><TableHead>Dispensed</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {(selectedOrder.items || []).map((it: any) => (
                        <TableRow key={it.dispense_item_id}>
                          <TableCell className="text-xs">{it.drug_code?.display || JSON.stringify(it.drug_code)}</TableCell>
                          <TableCell>{it.qty_requested}</TableCell>
                          <TableCell>{it.qty_dispensed}</TableCell>
                          <TableCell><Badge variant="outline">{it.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {(selectedOrder.backorders || []).length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center"><AlertTriangle className="w-4 h-4 mr-1 text-orange-500" />Backorders</h4>
                    {selectedOrder.backorders.map((bo: any) => (
                      <div key={bo.backorder_id} className="text-sm p-2 border rounded mb-1">
                        Qty Remaining: {bo.qty_remaining} — Status: {bo.status}
                      </div>
                    ))}
                  </div>
                )}
                {(selectedOrder.pickup_proofs || []).length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center"><ShieldCheck className="w-4 h-4 mr-1" />Pickup Proofs</h4>
                    {selectedOrder.pickup_proofs.map((pp: any) => (
                      <div key={pp.pickup_proof_id} className="text-sm p-2 border rounded mb-1">
                        Method: {pp.method} — Status: <Badge variant="outline">{pp.status}</Badge> — Delegated: {pp.is_delegated ? "Yes" : "No"}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function StockTab() {
  const [positions, setPositions] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [view, setView] = useState<"positions" | "movements">("positions");

  const fetchPositions = async () => {
    const res = await pharmacyClient.getStockPositions();
    setPositions(res.positions || []);
  };

  const fetchMovements = async () => {
    const res = await pharmacyClient.getStockMovements();
    setMovements(res.movements || []);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Stock Visibility</CardTitle>
            <CardDescription>Inventory positions and movement ledger</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant={view === "positions" ? "default" : "outline"} size="sm" onClick={() => { setView("positions"); fetchPositions(); }}>Positions</Button>
            <Button variant={view === "movements" ? "default" : "outline"} size="sm" onClick={() => { setView("movements"); fetchMovements(); }}>Movements</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {view === "positions" ? (
          <Table>
            <TableHeader><TableRow><TableHead>Store</TableHead><TableHead>Bin</TableHead><TableHead>Item</TableHead><TableHead>Batch</TableHead><TableHead>Expiry</TableHead><TableHead>Qty</TableHead></TableRow></TableHeader>
            <TableBody>
              {positions.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>{p.store_id}</TableCell>
                  <TableCell>{p.bin_id}</TableCell>
                  <TableCell className="text-xs">{p.item_code?.display || JSON.stringify(p.item_code)}</TableCell>
                  <TableCell>{p.batch || "—"}</TableCell>
                  <TableCell>{p.expiry || "—"}</TableCell>
                  <TableCell>{p.qty_on_hand}</TableCell>
                </TableRow>
              ))}
              {positions.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No stock positions</TableCell></TableRow>}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Item</TableHead><TableHead>Qty Δ</TableHead><TableHead>Reason</TableHead><TableHead>Ref</TableHead><TableHead>Actor</TableHead></TableRow></TableHeader>
            <TableBody>
              {movements.map((m: any) => (
                <TableRow key={m.movement_id}>
                  <TableCell className="text-xs">{new Date(m.created_at).toLocaleString()}</TableCell>
                  <TableCell className="text-xs">{m.item_code?.display || JSON.stringify(m.item_code)}</TableCell>
                  <TableCell className={m.qty_delta < 0 ? "text-destructive" : "text-green-600"}>{m.qty_delta}</TableCell>
                  <TableCell><Badge variant="outline">{m.reason}</Badge></TableCell>
                  <TableCell className="text-xs">{m.ref_type}: {m.ref_id?.substring(0, 15)}…</TableCell>
                  <TableCell className="text-xs">{m.created_by_actor_id}</TableCell>
                </TableRow>
              ))}
              {movements.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No movements</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function ReconcileTab() {
  const [items, setItems] = useState<any[]>([]);

  const fetchPending = async () => {
    const res = await pharmacyClient.getPendingReconciliation();
    setItems(res.items || []);
  };

  const resolveItem = async (recId: string) => {
    const res = await pharmacyClient.resolveReconciliation(recId, "Resolved via admin");
    if (res.code === "STEP_UP_REQUIRED") toast.error("Step-up required (simulated with HIGH assurance)");
    else { toast.success("Resolved"); fetchPending(); }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div><CardTitle>Stock Reconciliation</CardTitle><CardDescription>Pending drift cases (hybrid mode)</CardDescription></div>
          <Button onClick={fetchPending}>Refresh</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>External Key</TableHead><TableHead>Confidence</TableHead><TableHead>Status</TableHead><TableHead>Notes</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {items.map((it: any) => (
              <TableRow key={it.rec_id}>
                <TableCell className="font-mono text-xs">{it.external_key}</TableCell>
                <TableCell>{(it.confidence * 100).toFixed(0)}%</TableCell>
                <TableCell><Badge variant="outline">{it.status}</Badge></TableCell>
                <TableCell className="text-xs">{it.ops_notes || "—"}</TableCell>
                <TableCell><Button size="sm" onClick={() => resolveItem(it.rec_id)}>Resolve (step-up)</Button></TableCell>
              </TableRow>
            ))}
            {items.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No pending items</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function EventsTab() {
  const [events, setEvents] = useState<any[]>([]);
  const [filter, setFilter] = useState("");

  const fetchEvents = async () => {
    const res = await pharmacyClient.getEvents(filter || undefined);
    setEvents(res.events || []);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div><CardTitle>Integration Events/Intents</CardTitle><CardDescription>What would be Kafka events to OROS/MusheX/PCT</CardDescription></div>
          <div className="flex gap-2">
            <Input placeholder="Filter by entity_id..." value={filter} onChange={e => setFilter(e.target.value)} className="w-64" />
            <Button onClick={fetchEvents}>Load</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Event Type</TableHead><TableHead>Entity</TableHead><TableHead>Correlation</TableHead><TableHead>Payload</TableHead></TableRow></TableHeader>
          <TableBody>
            {events.map((ev: any) => (
              <TableRow key={ev.id}>
                <TableCell className="text-xs">{new Date(ev.created_at).toLocaleString()}</TableCell>
                <TableCell><Badge variant={ev.event_type.includes("mushex") ? "default" : ev.event_type.includes("pct") ? "secondary" : "outline"}>{ev.event_type}</Badge></TableCell>
                <TableCell className="text-xs">{ev.entity_type}: {ev.entity_id?.substring(0, 15)}…</TableCell>
                <TableCell className="font-mono text-xs">{ev.correlation_id?.substring(0, 8)}…</TableCell>
                <TableCell className="text-xs max-w-xs truncate">{JSON.stringify(ev.payload)}</TableCell>
              </TableRow>
            ))}
            {events.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No events</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function SimulateTab() {
  const [orosOrderId, setOrosOrderId] = useState("OROS-" + Date.now());
  const [cpid, setCpid] = useState("CPID-TEST-001");
  const [drugDisplay, setDrugDisplay] = useState("Amoxicillin 500mg");
  const [drugCode, setDrugCode] = useState("AMX500");
  const [qty, setQty] = useState("30");
  const [priority, setPriority] = useState("ROUTINE");
  const [result, setResult] = useState<any>(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeResult, setBarcodeResult] = useState<any>(null);
  const [claimToken, setClaimToken] = useState("");
  const [claimResult, setClaimResult] = useState<any>(null);

  const simulateOrder = async () => {
    const res = await pharmacyClient.receiveOrosOrder({
      oros_order_id: orosOrderId,
      patient_cpid: cpid,
      priority,
      items: [{ drug_code: { system: "http://snomed.info/sct", code: drugCode, display: drugDisplay }, quantity: Number(qty) }],
    });
    setResult(res);
    if (res.dispense_order_id) toast.success(`Created: ${res.dispense_order_id}`);
    else toast.error(res.message || "Failed");
    setOrosOrderId("OROS-" + Date.now());
  };

  const lookupBarcode = async () => {
    const res = await pharmacyClient.lookupBarcode(barcodeInput);
    setBarcodeResult(res);
  };

  const claimPickup = async () => {
    const res = await pharmacyClient.claimPickup(claimToken);
    setClaimResult(res);
    if (res.status === "CLAIMED") toast.success("Pickup claimed!");
    else toast.error(res.message || res.code || "Failed");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Simulate OROS Pharmacy Order</CardTitle><CardDescription>Creates a dispense order as if consumed from OROS</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>OROS Order ID</Label><Input value={orosOrderId} onChange={e => setOrosOrderId(e.target.value)} /></div>
            <div><Label>Patient CPID</Label><Input value={cpid} onChange={e => setCpid(e.target.value)} /></div>
            <div><Label>Drug Display</Label><Input value={drugDisplay} onChange={e => setDrugDisplay(e.target.value)} /></div>
            <div><Label>Drug Code</Label><Input value={drugCode} onChange={e => setDrugCode(e.target.value)} /></div>
            <div><Label>Quantity</Label><Input type="number" value={qty} onChange={e => setQty(e.target.value)} /></div>
            <div><Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ROUTINE">ROUTINE</SelectItem><SelectItem value="URGENT">URGENT</SelectItem><SelectItem value="STAT">STAT</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={simulateOrder}>Place Pharmacy Order</Button>
          {result && <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-40">{JSON.stringify(result, null, 2)}</pre>}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center"><ScanBarcode className="w-4 h-4 mr-2" />Barcode Lookup</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Enter barcode..." value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)} />
            <Button onClick={lookupBarcode} size="sm">Lookup</Button>
            {barcodeResult && <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-32">{JSON.stringify(barcodeResult, null, 2)}</pre>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center"><ShieldCheck className="w-4 h-4 mr-2" />Claim Pickup</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Enter OTP token..." value={claimToken} onChange={e => setClaimToken(e.target.value)} />
            <Button onClick={claimPickup} size="sm">Claim</Button>
            {claimResult && <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-32">{JSON.stringify(claimResult, null, 2)}</pre>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
