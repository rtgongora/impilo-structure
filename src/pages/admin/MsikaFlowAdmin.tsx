import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ShoppingCart, Package, Truck, Users, Shield, FileText,
  Play, CheckCircle, XCircle, Loader2, Search, RefreshCw,
  AlertTriangle, ArrowRight, Eye, Clock,
} from "lucide-react";
import * as flow from "@/lib/kernel/msika-flow/msikaFlowClient";

const STATUS_COLORS: Record<string, string> = {
  CREATED: "bg-muted text-muted-foreground",
  VALIDATED: "bg-blue-500/10 text-blue-600",
  PRICED: "bg-cyan-500/10 text-cyan-600",
  PAYMENT_PENDING: "bg-amber-500/10 text-amber-600",
  PAID: "bg-green-500/10 text-green-600",
  ROUTED: "bg-indigo-500/10 text-indigo-600",
  ACCEPTED: "bg-purple-500/10 text-purple-600",
  IN_PROGRESS: "bg-orange-500/10 text-orange-600",
  READY_FOR_PICKUP: "bg-teal-500/10 text-teal-600",
  COMPLETED: "bg-green-600/10 text-green-700",
  CANCELLED: "bg-destructive/10 text-destructive",
  FAILED: "bg-destructive/10 text-destructive",
};

export default function MsikaFlowAdmin() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            MSIKA Flow — Commerce & Fulfillment
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Order lifecycle, vendor management, ops console</p>
        </div>
        <Tabs defaultValue="marketplace" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="marketplace"><ShoppingCart className="h-4 w-4 mr-1" />Marketplace</TabsTrigger>
            <TabsTrigger value="orders"><Package className="h-4 w-4 mr-1" />Orders</TabsTrigger>
            <TabsTrigger value="vendor"><Truck className="h-4 w-4 mr-1" />Vendor Portal</TabsTrigger>
            <TabsTrigger value="ops"><Shield className="h-4 w-4 mr-1" />Ops Console</TabsTrigger>
            <TabsTrigger value="contracts"><FileText className="h-4 w-4 mr-1" />Contracts</TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace"><MarketplaceTab /></TabsContent>
          <TabsContent value="orders"><OrdersTab /></TabsContent>
          <TabsContent value="vendor"><VendorTab /></TabsContent>
          <TabsContent value="ops"><OpsTab /></TabsContent>
          <TabsContent value="contracts"><ContractsTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function MarketplaceTab() {
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);

  const runOtcFlow = async () => {
    setLoading(true);
    try {
      // 1) Create order
      const order = await flow.createOrder({
        type: "OTC_PRODUCT_ORDER",
        lines: [
          { msika_core_code: "PARA-500", kind: "PRODUCT", qty: 2, fulfillment_mode: "PHARMACY_PICKUP" },
          { msika_core_code: "IBU-200", kind: "PRODUCT", qty: 1, fulfillment_mode: "PHARMACY_PICKUP" },
        ],
      });
      toast.success(`Order created: ${order.order_id}`);

      // 2) Price
      const priced = await flow.priceOrder(order.order_id);
      toast.success(`Priced: ZAR ${priced.amount_total}`);

      // 3) Pay
      const paid = await flow.payOrder(order.order_id);
      toast.success(`Paid: ${paid.mushex_payment_intent_id}`);

      // 4) Route
      const routed = await flow.routeOrder(order.order_id);
      toast.success(`Routed: ${routed.route_id}`);

      // 5) Accept
      const accepted = await flow.acceptOrder(order.order_id);
      toast.success(`Vendor accepted → ${accepted.status}`);

      // 6) Mark ready
      const ready = await flow.markReady(order.order_id);
      toast.success(`Ready for pickup`);

      // 7) Issue pickup
      const pickup = await flow.issuePickup(order.order_id);
      toast.success(`OTP: ${pickup.otp}`);

      // 8) Claim
      const claimed = await flow.claimPickup(order.order_id, pickup.otp);
      toast.success(`Pickup claimed! Order complete.`);

      setOrderResult({ ...claimed, otp: pickup.otp, order_id: order.order_id, amount: priced.amount_total });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">🛒 OTC Flow Demo</CardTitle>
          <CardDescription>End-to-end: create → price → pay → route → pickup → complete</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runOtcFlow} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            Run Full OTC Flow
          </Button>
          {orderResult && (
            <div className="mt-4 p-3 bg-muted rounded-md text-sm space-y-1">
              <p><strong>Order:</strong> {orderResult.order_id}</p>
              <p><strong>Amount:</strong> ZAR {orderResult.amount}</p>
              <p><strong>OTP:</strong> {orderResult.otp}</p>
              <p><strong>Status:</strong> <Badge className={STATUS_COLORS.COMPLETED}>COMPLETED</Badge></p>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📋 RX Flow Demo</CardTitle>
          <CardDescription>Attach prescription → validate → substitution → fulfill</CardDescription>
        </CardHeader>
        <CardContent>
          <RxFlowDemo />
        </CardContent>
      </Card>
    </div>
  );
}

function RxFlowDemo() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const run = async () => {
    setLoading(true);
    try {
      const order = await flow.createOrder({
        type: "RX_FULFILLMENT_ORDER",
        lines: [{ msika_core_code: "AMOX-250", kind: "PRODUCT", qty: 1, restrictions: { prescription_required: { enabled: true } } }],
      });
      const attached = await flow.attachRxToken(order.order_id, "RX-TOKEN-" + crypto.randomUUID().slice(0, 8));
      const priced = await flow.priceOrder(order.order_id);
      setResult({ order_id: order.order_id, rx_attached: attached.rx_token_attached, amount: priced.amount_total });
      toast.success("RX flow completed through pricing");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <>
      <Button onClick={run} disabled={loading} variant="outline" className="w-full">
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
        Run RX Flow
      </Button>
      {result && (
        <div className="mt-4 p-3 bg-muted rounded-md text-sm space-y-1">
          <p><strong>Order:</strong> {result.order_id}</p>
          <p><strong>RX Attached:</strong> {result.rx_attached ? "✅" : "❌"}</p>
          <p><strong>Amount:</strong> ZAR {result.amount}</p>
        </div>
      )}
    </>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await flow.listOrders();
      setOrders(data.orders || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const viewOrder = async (id: string) => {
    try {
      const data = await flow.getOrder(id);
      setSelectedOrder(data);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={load} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-1" />Load Orders
        </Button>
      </div>
      <div className="grid gap-2">
        {orders.map((o) => (
          <Card key={o.order_id} className="cursor-pointer hover:border-primary/50" onClick={() => viewOrder(o.order_id)}>
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-mono">{o.order_id?.slice(0, 12)}...</p>
                  <p className="text-xs text-muted-foreground">{o.type} • ZAR {o.amount_total || 0}</p>
                </div>
              </div>
              <Badge className={STATUS_COLORS[o.status] || ""}>{o.status}</Badge>
            </CardContent>
          </Card>
        ))}
        {orders.length === 0 && !loading && <p className="text-sm text-muted-foreground">No orders. Run a demo flow first.</p>}
      </div>
      {selectedOrder && (
        <Card>
          <CardHeader><CardTitle className="text-base">Order Detail</CardTitle></CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">{JSON.stringify(selectedOrder, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function VendorTab() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("PHARMACY");

  const apply = async () => {
    try {
      const v = await flow.applyVendor({ name, type });
      toast.success(`Vendor applied: ${v.vendor_id}`);
      setName("");
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const load = async () => {
    try {
      const data = await flow.listVendors();
      setVendors(data.vendors || []);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Apply as Vendor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Vendor name" value={name} onChange={(e) => setName(e.target.value)} />
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["PHARMACY","FACILITY","SUPPLIER","LAB","RADIOLOGY","CLINIC","DELIVERY"].map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={apply} disabled={!name} className="w-full">Submit Application</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Vendors</CardTitle>
          <Button variant="ghost" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent>
          {vendors.map((v) => (
            <div key={v.vendor_id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium">{v.name}</p>
                <p className="text-xs text-muted-foreground">{v.type}</p>
              </div>
              <Badge variant={v.status === "APPROVED" ? "default" : "secondary"}>{v.status}</Badge>
            </div>
          ))}
          {vendors.length === 0 && <p className="text-sm text-muted-foreground">No vendors yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function OpsTab() {
  const [reviews, setReviews] = useState<any[]>([]);

  const load = async () => {
    try {
      const data = await flow.getPendingReviews();
      setReviews(data.reviews || []);
    } catch (e: any) { toast.error(e.message); }
  };

  const approve = async (id: string) => {
    try {
      await flow.approveReview(id);
      toast.success("Approved");
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const reject = async (id: string) => {
    try {
      await flow.rejectReview(id, "Rejected via ops console");
      toast.success("Rejected");
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <Button onClick={load} variant="outline" size="sm">
        <RefreshCw className="h-4 w-4 mr-1" />Load Pending Reviews
      </Button>
      {reviews.map((r) => (
        <Card key={r.id}>
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{r.entity_type}: {r.entity_id?.slice(0, 12)}...</p>
              <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => approve(r.id)}><CheckCircle className="h-4 w-4 mr-1" />Approve</Button>
              <Button size="sm" variant="outline" onClick={() => reject(r.id)}><XCircle className="h-4 w-4 mr-1" />Reject</Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {reviews.length === 0 && <p className="text-sm text-muted-foreground">No pending reviews. Run a vendor application first.</p>}
    </div>
  );
}

function ContractsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">MSIKA Flow Contract Artifacts</CardTitle>
        <CardDescription>OpenAPI + JSON Schemas for the Java team</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>📄 <code>docs/contracts/MSIKA_FLOW_V1_CONTRACTS.md</code></p>
        <Separator />
        <p className="text-xs text-muted-foreground">Schemas: order.schema.json, price_snapshot.schema.json, restrictions_snapshot.schema.json, pickup_claim.schema.json</p>
        <p className="text-xs text-muted-foreground">OpenAPI: msika-flow.openapi.yaml — all endpoints documented</p>
        <Separator />
        <div className="text-xs space-y-1">
          <p><strong>State machine:</strong> CREATED → VALIDATED → PRICED → PAYMENT_PENDING → PAID → ROUTED → ACCEPTED → IN_PROGRESS → READY_FOR_PICKUP → COLLECTED → COMPLETED</p>
          <p><strong>Step-up triggers:</strong> delegated pickup, refunds &gt; ZAR 1000, controlled items, vendor banking updates</p>
          <p><strong>Security:</strong> OTP brute-force lockout (5 attempts → 5min lock), one-time pickup tokens, no PII stored</p>
        </div>
      </CardContent>
    </Card>
  );
}
