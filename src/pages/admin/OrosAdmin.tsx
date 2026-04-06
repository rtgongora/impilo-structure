import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { orosClient } from "@/lib/kernel/oros/orosClient";
import { ClipboardList, Activity, AlertTriangle, Settings, FileText, ArrowLeftRight, Zap } from "lucide-react";

const statusColors: Record<string, string> = {
  PLACED: "bg-blue-100 text-blue-800", ACCEPTED: "bg-cyan-100 text-cyan-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800", RESULT_AVAILABLE: "bg-green-100 text-green-800",
  REVIEWED: "bg-emerald-100 text-emerald-800", COMPLETED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800", REJECTED: "bg-red-100 text-red-800",
  PARTIAL_RESULT: "bg-orange-100 text-orange-800", FAILED: "bg-red-200 text-red-900",
};

export default function OrosAdmin() {
  const [tab, setTab] = useState("worklist");

  return (
    <AppLayout title="OROS — Orders & Results">
      <div className="flex-1 flex flex-col min-h-0 p-6 overflow-auto space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">OROS v1.1 — Orders & Results Orchestration</h1>
          <Badge variant="outline">PII-Minimized</Badge>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="worklist"><ClipboardList className="h-4 w-4 mr-1" />Worklists</TabsTrigger>
            <TabsTrigger value="place"><Zap className="h-4 w-4 mr-1" />Place Order</TabsTrigger>
            <TabsTrigger value="detail"><FileText className="h-4 w-4 mr-1" />Order Detail</TabsTrigger>
            <TabsTrigger value="reconcile"><ArrowLeftRight className="h-4 w-4 mr-1" />Reconciliation</TabsTrigger>
            <TabsTrigger value="capabilities"><Settings className="h-4 w-4 mr-1" />Capabilities</TabsTrigger>
            <TabsTrigger value="events"><Activity className="h-4 w-4 mr-1" />Event Log</TabsTrigger>
            <TabsTrigger value="intents"><AlertTriangle className="h-4 w-4 mr-1" />Writeback Intents</TabsTrigger>
          </TabsList>

          <TabsContent value="worklist"><WorklistTab /></TabsContent>
          <TabsContent value="place"><PlaceOrderTab /></TabsContent>
          <TabsContent value="detail"><OrderDetailTab /></TabsContent>
          <TabsContent value="reconcile"><ReconcileTab /></TabsContent>
          <TabsContent value="capabilities"><CapabilitiesTab /></TabsContent>
          <TabsContent value="events"><EventLogTab /></TabsContent>
          <TabsContent value="intents"><WritebackIntentsTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

// ── Worklist Tab ──
function WorklistTab() {
  const [facilityId, setFacilityId] = useState("");
  const [type, setType] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await orosClient.getWorklists({ facilityId: facilityId || undefined, type: type || undefined });
      setItems(res.items || []);
    } catch { toast.error("Failed to load worklist"); }
    setLoading(false);
  };

  const doAction = async (orderId: string, action: string) => {
    try {
      if (action === "accept") await orosClient.acceptOrder(orderId);
      else if (action === "reject") await orosClient.rejectOrder(orderId, "Rejected from worklist");
      toast.success(`Order ${action}ed`);
      load();
    } catch { toast.error(`Failed to ${action}`); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Department Worklists</CardTitle>
        <CardDescription>Actionable orders filtered by facility and type</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 items-end">
          <div><Label>Facility ID</Label><Input value={facilityId} onChange={e => setFacilityId(e.target.value)} placeholder="FAC-001" /></div>
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-32"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="LAB">LAB</SelectItem>
                <SelectItem value="IMAGING">IMAGING</SelectItem>
                <SelectItem value="PHARMACY">PHARMACY</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={load} disabled={loading}>{loading ? "Loading..." : "Load Worklist"}</Button>
        </div>

        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4">No items. Load a worklist above.</p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr><th className="p-2 text-left">Order ID</th><th className="p-2">Type</th><th className="p-2">Priority</th><th className="p-2">Status</th><th className="p-2">CPID</th><th className="p-2">Placed</th><th className="p-2">Actions</th></tr>
              </thead>
              <tbody>
                {items.map((item: any) => (
                  <tr key={item.order_id} className="border-t">
                    <td className="p-2 font-mono text-xs">{item.order_id}</td>
                    <td className="p-2 text-center"><Badge variant="outline">{item.type}</Badge></td>
                    <td className="p-2 text-center"><Badge className={item.priority === "STAT" ? "bg-red-500 text-white" : item.priority === "URGENT" ? "bg-orange-500 text-white" : ""}>{item.priority}</Badge></td>
                    <td className="p-2 text-center"><Badge className={statusColors[item.status] || ""}>{item.status}</Badge></td>
                    <td className="p-2 font-mono text-xs">{item.patient_cpid}</td>
                    <td className="p-2 text-xs">{item.placed_at ? new Date(item.placed_at).toLocaleString() : "—"}</td>
                    <td className="p-2 flex gap-1">
                      {item.status === "PLACED" && <><Button size="sm" variant="default" onClick={() => doAction(item.order_id, "accept")}>Accept</Button><Button size="sm" variant="destructive" onClick={() => doAction(item.order_id, "reject")}>Reject</Button></>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Place Order Tab ──
function PlaceOrderTab() {
  const [facilityId, setFacilityId] = useState("FAC-001");
  const [cpid, setCpid] = useState("");
  const [type, setType] = useState("LAB");
  const [priority, setPriority] = useState("ROUTINE");
  const [codeSystem, setCodeSystem] = useState("http://loinc.org");
  const [codeValue, setCodeValue] = useState("");
  const [codeDisplay, setCodeDisplay] = useState("");
  const [result, setResult] = useState<any>(null);

  const place = async () => {
    try {
      const res = await orosClient.placeOrder({
        facility_id: facilityId, patient_cpid: cpid, type, priority,
        zibo_order_code: codeValue ? { system: codeSystem, code: codeValue, display: codeDisplay } : undefined,
        items: codeValue ? [{ code: { system: codeSystem, code: codeValue, display: codeDisplay }, quantity: 1 }] : [],
      });
      setResult(res);
      toast.success(`Order placed: ${res.order_id}`);
    } catch { toast.error("Failed to place order"); }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Place New Order</CardTitle><CardDescription>CPID-only, PII-minimized</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Facility ID</Label><Input value={facilityId} onChange={e => setFacilityId(e.target.value)} /></div>
          <div><Label>Patient CPID</Label><Input value={cpid} onChange={e => setCpid(e.target.value)} placeholder="CPID-..." /></div>
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="LAB">LAB</SelectItem><SelectItem value="IMAGING">IMAGING</SelectItem><SelectItem value="PHARMACY">PHARMACY</SelectItem><SelectItem value="PROCEDURE">PROCEDURE</SelectItem></SelectContent>
            </Select>
          </div>
          <div>
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="ROUTINE">ROUTINE</SelectItem><SelectItem value="URGENT">URGENT</SelectItem><SelectItem value="STAT">STAT</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>Code System</Label><Input value={codeSystem} onChange={e => setCodeSystem(e.target.value)} /></div>
          <div><Label>Code</Label><Input value={codeValue} onChange={e => setCodeValue(e.target.value)} placeholder="2093-3" /></div>
          <div className="col-span-2"><Label>Display</Label><Input value={codeDisplay} onChange={e => setCodeDisplay(e.target.value)} placeholder="Cholesterol" /></div>
        </div>
        <Button onClick={place} disabled={!cpid}>Place Order</Button>
        {result && <pre className="bg-muted p-3 rounded text-xs overflow-auto mt-2">{JSON.stringify(result, null, 2)}</pre>}
      </CardContent>
    </Card>
  );
}

// ── Order Detail Tab ──
function OrderDetailTab() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<any>(null);

  const load = async () => {
    try {
      const res = await orosClient.getOrder(orderId);
      setOrder(res);
    } catch { toast.error("Failed to load order"); }
  };

  const doStep = async (stepId: string, action: "start" | "complete") => {
    try {
      if (action === "start") await orosClient.startWorkstep(stepId);
      else await orosClient.completeWorkstep(stepId);
      toast.success(`Step ${action}ed`);
      load();
    } catch { toast.error(`Failed to ${action} step`); }
  };

  const postResult = async () => {
    try {
      await orosClient.postResult(orderId, { kind: order.type || "LAB", summary: { note: "Lab result submitted" } });
      toast.success("Result posted");
      load();
    } catch { toast.error("Failed to post result"); }
  };

  const ack = async () => {
    try {
      await orosClient.ackOrder(orderId, "CLINICIAN", "Reviewed and noted");
      toast.success("Acknowledged");
      load();
    } catch { toast.error("Failed to acknowledge"); }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Order Detail</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1"><Label>Order ID</Label><Input value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="ORD-..." /></div>
          <Button onClick={load}>Load</Button>
        </div>

        {order && (
          <div className="space-y-4">
            <div className="flex gap-2 items-center">
              <Badge className={statusColors[order.status] || ""}>{order.status}</Badge>
              <Badge variant="outline">{order.type}</Badge>
              <Badge variant="outline">{order.priority}</Badge>
              <span className="text-xs text-muted-foreground font-mono">CPID: {order.patient_cpid}</span>
            </div>

            {/* Worksteps */}
            <div>
              <h3 className="font-semibold mb-2">Worksteps</h3>
              <div className="space-y-1">
                {(order.worksteps || []).map((s: any) => (
                  <div key={s.workstep_id} className="flex items-center gap-2 p-2 border rounded text-sm">
                    <Badge variant="outline" className="font-mono text-xs">{s.step_type}</Badge>
                    <Badge className={s.status === "DONE" ? "bg-green-100 text-green-800" : s.status === "IN_PROGRESS" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100"}>{s.status}</Badge>
                    {s.status === "PENDING" && <Button size="sm" variant="outline" onClick={() => doStep(s.workstep_id, "start")}>Start</Button>}
                    {s.status === "IN_PROGRESS" && <Button size="sm" variant="outline" onClick={() => doStep(s.workstep_id, "complete")}>Complete</Button>}
                  </div>
                ))}
              </div>
            </div>

            {/* Results */}
            <div>
              <h3 className="font-semibold mb-2">Results</h3>
              {(order.results || []).length === 0 ? (
                <div className="flex gap-2">
                  <p className="text-sm text-muted-foreground">No results yet.</p>
                  <Button size="sm" onClick={postResult}>Post Result</Button>
                </div>
              ) : (order.results || []).map((r: any) => (
                <div key={r.result_id} className="p-2 border rounded text-sm mb-1">
                  <div className="flex gap-2 items-center">
                    <Badge variant="outline">{r.kind}</Badge>
                    {r.is_critical && <Badge className="bg-red-500 text-white">CRITICAL</Badge>}
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Acknowledgements */}
            <div>
              <h3 className="font-semibold mb-2">Acknowledgements</h3>
              {(order.acknowledgements || []).map((a: any) => (
                <div key={a.ack_id} className="text-sm p-1">{a.ack_type} by {a.actor_id} at {new Date(a.ack_at).toLocaleString()}</div>
              ))}
              {order.status === "RESULT_AVAILABLE" && <Button size="sm" onClick={ack}>Acknowledge (Clinician)</Button>}
            </div>

            {/* Raw */}
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">Raw JSON</summary>
              <pre className="bg-muted p-2 rounded mt-1 overflow-auto max-h-60">{JSON.stringify(order, null, 2)}</pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Reconciliation Tab ──
function ReconcileTab() {
  const [facilityId, setFacilityId] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [matchOrderId, setMatchOrderId] = useState("");

  const load = async () => {
    const res = await orosClient.getReconcilePending(facilityId || undefined);
    setItems(res.items || []);
  };

  const match = async (recId: string) => {
    if (!matchOrderId) return toast.error("Enter order ID to match");
    await orosClient.matchReconcile(recId, matchOrderId);
    toast.success("Matched"); load();
  };

  const resolve = async (recId: string) => {
    const res = await orosClient.resolveReconcile(recId);
    if (res.error?.code === "STEP_UP_REQUIRED") {
      toast.error("Step-up required: " + res.error.next.reason);
    } else {
      toast.success("Resolved"); load();
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Hybrid Reconciliation</CardTitle><CardDescription>Match external results to internal orders</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 items-end">
          <div><Label>Facility ID</Label><Input value={facilityId} onChange={e => setFacilityId(e.target.value)} /></div>
          <Button onClick={load}>Load Pending</Button>
        </div>
        <div><Label>Order ID for matching</Label><Input value={matchOrderId} onChange={e => setMatchOrderId(e.target.value)} placeholder="ORD-..." /></div>

        {items.map((item: any) => (
          <div key={item.rec_id} className="border rounded p-3 space-y-2">
            <div className="flex gap-2 items-center">
              <Badge>{item.status}</Badge>
              <span className="font-mono text-xs">External: {item.external_key}</span>
              <span className="text-xs text-muted-foreground">Confidence: {(item.confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => match(item.rec_id)}>Match</Button>
              {item.status === "MATCHED" && <Button size="sm" onClick={() => resolve(item.rec_id)}>Resolve (Step-up)</Button>}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Capabilities Tab ──
function CapabilitiesTab() {
  const [facilityId, setFacilityId] = useState("FAC-001");
  const [caps, setCaps] = useState<any>(null);

  const load = async () => {
    const res = await orosClient.getCapabilities(facilityId);
    setCaps(res);
  };

  const save = async () => {
    await orosClient.upsertCapabilities({ ...caps, facility_id: facilityId });
    toast.success("Capabilities saved");
  };

  return (
    <Card>
      <CardHeader><CardTitle>Facility Capabilities</CardTitle><CardDescription>Configure routing: internal vs external adapters</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 items-end">
          <div><Label>Facility ID</Label><Input value={facilityId} onChange={e => setFacilityId(e.target.value)} /></div>
          <Button onClick={load}>Load</Button>
        </div>

        {caps && (
          <div className="space-y-3">
            <div className="flex items-center gap-3"><Switch checked={caps.uses_external_lims} onCheckedChange={v => setCaps({ ...caps, uses_external_lims: v })} /><Label>External LIMS</Label></div>
            <div className="flex items-center gap-3"><Switch checked={caps.uses_external_pacs} onCheckedChange={v => setCaps({ ...caps, uses_external_pacs: v })} /><Label>External PACS</Label></div>
            <div className="flex items-center gap-3"><Switch checked={caps.uses_external_pharmacy} onCheckedChange={v => setCaps({ ...caps, uses_external_pharmacy: v })} /><Label>External Pharmacy</Label></div>
            <div className="flex items-center gap-3"><Switch checked={caps.hybrid_mode_enabled} onCheckedChange={v => setCaps({ ...caps, hybrid_mode_enabled: v })} /><Label>Hybrid Mode</Label></div>
            <Button onClick={save}>Save</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Event Log Tab ──
function EventLogTab() {
  const [orderId, setOrderId] = useState("");
  const [events, setEvents] = useState<any[]>([]);

  const load = async () => {
    const res = await orosClient.getEvents(orderId || undefined);
    setEvents(res.events || []);
  };

  return (
    <Card>
      <CardHeader><CardTitle>OROS Event Log</CardTitle><CardDescription>"Would-have-published" events for Kafka integration reference</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1"><Label>Filter by Order ID</Label><Input value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="Optional" /></div>
          <Button onClick={load}>Load Events</Button>
        </div>
        <div className="border rounded-lg max-h-96 overflow-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 sticky top-0"><tr><th className="p-2 text-left">Time</th><th className="p-2">Event</th><th className="p-2">Entity</th><th className="p-2">Correlation</th></tr></thead>
            <tbody>
              {events.map((e: any) => (
                <tr key={e.id} className="border-t">
                  <td className="p-2">{new Date(e.created_at).toLocaleString()}</td>
                  <td className="p-2"><Badge variant="outline" className="font-mono">{e.event_type}</Badge></td>
                  <td className="p-2 font-mono">{e.entity_id}</td>
                  <td className="p-2 font-mono text-muted-foreground">{e.correlation_id?.substring(0, 8)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Writeback Intents Tab ──
function WritebackIntentsTab() {
  const [orderId, setOrderId] = useState("");
  const [intents, setIntents] = useState<any[]>([]);

  const load = async () => {
    const res = await orosClient.getWritebackIntents(orderId || undefined);
    setIntents(res.intents || []);
  };

  return (
    <Card>
      <CardHeader><CardTitle>Writeback Intents</CardTitle><CardDescription>BUTANO + PCT integration reference — what would be sent</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1"><Label>Filter by Order ID</Label><Input value={orderId} onChange={e => setOrderId(e.target.value)} /></div>
          <Button onClick={load}>Load</Button>
        </div>
        <div className="space-y-2">
          {intents.map((i: any) => (
            <div key={i.id} className="border rounded p-3 text-sm">
              <div className="flex gap-2 items-center mb-1">
                <Badge>{i.target}</Badge>
                <Badge variant="outline" className="font-mono">{i.intent_type}</Badge>
                <Badge className={i.status === "PENDING" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}>{i.status}</Badge>
              </div>
              <pre className="text-xs bg-muted p-1 rounded overflow-auto">{JSON.stringify(i.payload, null, 2)}</pre>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
