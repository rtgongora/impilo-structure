import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mushexClient, type MushexHeaders } from "@/lib/kernel/mushex/mushexClient";
import { CreditCard, FileText, Shield, DollarSign, AlertTriangle, Receipt } from "lucide-react";

const defaultHeaders: MushexHeaders = {
  tenantId: "demo-tenant",
  actorId: "dev-ops-1",
  actorType: "OPS",
  facilityId: "facility-1",
  deviceFingerprint: "dev-browser",
  purposeOfUse: "ADMIN",
};

export default function MushexAdmin() {
  const [activeTab, setActiveTab] = useState("payments");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepUpMode, setStepUpMode] = useState(false);

  const headers = { ...defaultHeaders, stepUp: stepUpMode };

  const exec = async (fn: () => Promise<any>) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fn();
      setResult(r);
    } catch (e: any) {
      if (e.code === "STEP_UP_REQUIRED") {
        setError("⚠️ STEP_UP_REQUIRED — Enable step-up mode and retry.");
      } else {
        setError(e.error?.message || e.message || JSON.stringify(e));
      }
      setResult(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-primary" />
              MUSHEX v1.1 Console
            </h1>
            <p className="text-muted-foreground mt-1">National Payment Switch & Claims Switching</p>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Step-Up Mode</Label>
            <Button
              variant={stepUpMode ? "default" : "outline"}
              size="sm"
              onClick={() => setStepUpMode(!stepUpMode)}
            >
              {stepUpMode ? "✅ Enabled" : "Disabled"}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="payments"><CreditCard className="h-4 w-4 mr-1" />Payments</TabsTrigger>
            <TabsTrigger value="remittance"><Receipt className="h-4 w-4 mr-1" />Remittance</TabsTrigger>
            <TabsTrigger value="claims"><FileText className="h-4 w-4 mr-1" />Claims</TabsTrigger>
            <TabsTrigger value="settlements"><DollarSign className="h-4 w-4 mr-1" />Settlements</TabsTrigger>
            <TabsTrigger value="ops"><Shield className="h-4 w-4 mr-1" />Ops/Fraud</TabsTrigger>
            <TabsTrigger value="ledger"><DollarSign className="h-4 w-4 mr-1" />Ledger</TabsTrigger>
          </TabsList>

          {/* PAYMENTS TAB */}
          <TabsContent value="payments">
            <div className="grid grid-cols-2 gap-4">
              <PaymentSimulator headers={headers} exec={exec} loading={loading} />
              <Card>
                <CardHeader><CardTitle className="text-lg">Lookup Intent</CardTitle></CardHeader>
                <CardContent>
                  <LookupForm label="Intent ID" onSubmit={(id) => exec(() => mushexClient.getPaymentIntent(headers, id))} loading={loading} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* REMITTANCE TAB */}
          <TabsContent value="remittance">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Issue Remittance Slip</CardTitle>
                  <CardDescription>Generate OTP/QR for delegated payment</CardDescription>
                </CardHeader>
                <CardContent>
                  <LookupForm label="Intent ID" buttonText="Issue Slip" onSubmit={(id) => exec(() => mushexClient.issueRemittanceSlip(headers, id))} loading={loading} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Claim Remittance</CardTitle>
                  <CardDescription>Redeem OTP + token</CardDescription>
                </CardHeader>
                <CardContent>
                  <ClaimRemittanceForm headers={headers} exec={exec} loading={loading} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* CLAIMS TAB */}
          <TabsContent value="claims">
            <div className="grid grid-cols-2 gap-4">
              <ClaimSimulator headers={headers} exec={exec} loading={loading} />
              <Card>
                <CardHeader><CardTitle className="text-lg">Lookup / Submit Claim</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <LookupForm label="Claim ID" onSubmit={(id) => exec(() => mushexClient.getClaim(headers, id))} loading={loading} />
                  <LookupForm label="Claim ID" buttonText="Submit" onSubmit={(id) => exec(() => mushexClient.submitClaim(headers, id))} loading={loading} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* SETTLEMENTS TAB */}
          <TabsContent value="settlements">
            <div className="grid grid-cols-2 gap-4">
              <SettlementRunner headers={headers} exec={exec} loading={loading} />
              <Card>
                <CardHeader><CardTitle className="text-lg">Lookup / Release</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <LookupForm label="Settlement ID" onSubmit={(id) => exec(() => mushexClient.getSettlement(headers, id))} loading={loading} />
                  <LookupForm label="Settlement ID" buttonText="Release Payouts (Step-Up)" onSubmit={(id) => exec(() => mushexClient.releasePayouts(headers, id))} loading={loading} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* OPS/FRAUD TAB */}
          <TabsContent value="ops">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Pending Reviews</CardTitle></CardHeader>
                <CardContent>
                  <Button onClick={() => exec(() => mushexClient.getPendingReviews(headers))} disabled={loading}>Load Reviews</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Fraud Flags</CardTitle></CardHeader>
                <CardContent>
                  <Button onClick={() => exec(() => mushexClient.getFraudFlags(headers))} disabled={loading}>Load Flags</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* LEDGER TAB */}
          <TabsContent value="ledger">
            <Card>
              <CardHeader><CardTitle className="text-lg">Ledger Balances</CardTitle></CardHeader>
              <CardContent>
                <Button onClick={() => exec(() => mushexClient.getLedgerBalance(headers))} disabled={loading}>Load Balances</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Result Display */}
        {result && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Response</CardTitle></CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-96">{JSON.stringify(result, null, 2)}</pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function PaymentSimulator({ headers, exec, loading }: any) {
  const [sourceType, setSourceType] = useState("COSTA_BILL");
  const [amount, setAmount] = useState("250");
  const [adapter, setAdapter] = useState("SANDBOX");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Create Payment Intent</CardTitle>
        <CardDescription>Simulate payment creation with adapter processing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label>Source Type</Label>
          <Select value={sourceType} onValueChange={setSourceType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="COSTA_BILL">COSTA Bill</SelectItem>
              <SelectItem value="MSIKA_ORDER">MSIKA Order</SelectItem>
              <SelectItem value="ADHOC">Ad-hoc</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Amount (ZAR)</Label>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <Label>Adapter</Label>
          <Select value={adapter} onValueChange={setAdapter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="SANDBOX">Sandbox</SelectItem>
              <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
              <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
              <SelectItem value="CARD">Card</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          className="w-full"
          disabled={loading}
          onClick={() => exec(() => mushexClient.createPaymentIntent(headers, {
            source_type: sourceType,
            source_id: `SRC-${Date.now()}`,
            amount: Number(amount),
            adapter_type: adapter,
          }))}
        >
          Create & Process
        </Button>
      </CardContent>
    </Card>
  );
}

function ClaimRemittanceForm({ headers, exec, loading }: any) {
  const [intentId, setIntentId] = useState("");
  const [token, setToken] = useState("");
  const [otp, setOtp] = useState("");

  return (
    <div className="space-y-3">
      <div>
        <Label>Intent ID</Label>
        <Input value={intentId} onChange={(e) => setIntentId(e.target.value)} placeholder="Intent ID from slip" />
      </div>
      <div>
        <Label>Token</Label>
        <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Hex token" />
      </div>
      <div>
        <Label>OTP</Label>
        <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit OTP" />
      </div>
      <Button
        className="w-full"
        disabled={loading || !intentId || !token || !otp}
        onClick={() => exec(() => mushexClient.claimRemittance(headers, { intent_id: intentId, token, otp }))}
      >
        Claim Remittance
      </Button>
    </div>
  );
}

function ClaimSimulator({ headers, exec, loading }: any) {
  const [billId, setBillId] = useState(`BILL-${Date.now()}`);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Create Claim</CardTitle>
        <CardDescription>Submit claim against insurer for a COSTA bill</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label>Bill ID</Label>
          <Input value={billId} onChange={(e) => setBillId(e.target.value)} />
        </div>
        <Button
          className="w-full"
          disabled={loading}
          onClick={() => exec(() => mushexClient.createClaim(headers, {
            bill_id: billId,
            insurer_id: "ins-demo-1",
            facility_id: "facility-1",
            totals: { gross: 5000, net: 4500 },
            bill_pack_json: { lines: [{ code: "CONSULT-001", amount: 350 }, { code: "LAB-CBC", amount: 150 }] },
          }))}
        >
          Create Claim
        </Button>
      </CardContent>
    </Card>
  );
}

function SettlementRunner({ headers, exec, loading }: any) {
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const [start, setStart] = useState(weekAgo);
  const [end, setEnd] = useState(today);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Run Settlement</CardTitle>
        <CardDescription>Aggregate payments minus refunds and compute payouts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label>Period Start</Label>
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <Label>Period End</Label>
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <Button className="w-full" disabled={loading} onClick={() => exec(() => mushexClient.runSettlement(headers, { period_start: start, period_end: end }))}>
          Run Settlement
        </Button>
      </CardContent>
    </Card>
  );
}

function LookupForm({ label, buttonText, onSubmit, loading }: { label: string; buttonText?: string; onSubmit: (val: string) => void; loading: boolean }) {
  const [val, setVal] = useState("");
  return (
    <div className="flex gap-2">
      <Input placeholder={label} value={val} onChange={(e) => setVal(e.target.value)} />
      <Button onClick={() => onSubmit(val)} disabled={loading || !val}>{buttonText || "Lookup"}</Button>
    </div>
  );
}
