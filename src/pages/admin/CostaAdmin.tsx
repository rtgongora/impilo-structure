import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { costaClient } from "@/lib/kernel/costa/costaClient";
import { Calculator, FileText, Receipt, Shield, Activity, Settings, AlertTriangle, CheckCircle } from "lucide-react";

export default function CostaAdmin() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("simulate");

  // ── Simulation state ──
  const [simLines, setSimLines] = useState<any[]>([
    { msika_code: "CONS-001", kind: "SERVICE", qty: 1, cost_method: "TARIFF" },
    { msika_code: "LAB-CBC", kind: "SERVICE", qty: 1, cost_method: "TARIFF" },
  ]);
  const [simResult, setSimResult] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);

  // ── Bills state ──
  const [bills, setBills] = useState<any[]>([]);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [billLoading, setBillLoading] = useState(false);

  // ── Tariffs state ──
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [csvImport, setCsvImport] = useState("");

  // ── Rulesets state ──
  const [rulesets, setRulesets] = useState<any[]>([]);
  const [rulesetJson, setRulesetJson] = useState('[\n  { "type": "MARKUP", "kind": "*", "value": 30, "priority": 1 }\n]');

  // ── Audit state ──
  const [auditEntries, setAuditEntries] = useState<any[]>([]);
  const [auditBillId, setAuditBillId] = useState("");

  // ── Step-up banner ──
  const [stepUpRequired, setStepUpRequired] = useState(false);

  const handleStepUpRetry = async (fn: () => Promise<any>) => {
    setStepUpRequired(false);
    const result = await fn();
    if (result?.code === "STEP_UP_REQUIRED") {
      setStepUpRequired(true);
      toast({ title: "Step-Up Required", description: "High-risk action requires additional authentication.", variant: "destructive" });
    }
    return result;
  };

  // ── Simulation ──
  const runEstimate = async () => {
    setSimLoading(true);
    try {
      const result = await costaClient.createEstimate(simLines, "cpid-demo-001", { age_eligible: false });
      setSimResult(result);
      toast({ title: "Estimate computed", description: `Total charge: ${result?.totals?.charge || 0}` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setSimLoading(false);
  };

  const createDraftFromEstimate = async () => {
    if (!simResult) return;
    setBillLoading(true);
    try {
      const result = await costaClient.createDraftBill({ lines: simLines, facility_id: "demo-facility" });
      toast({ title: "Draft bill created", description: `Bill ID: ${result?.bill_id}` });
      loadBills();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setBillLoading(false);
  };

  // ── Bills ──
  const loadBills = async () => {
    setBillLoading(true);
    const result = await costaClient.listBills();
    setBills(result?.bills || []);
    setBillLoading(false);
  };

  const viewBill = async (billId: string) => {
    const result = await costaClient.getBill(billId);
    setSelectedBill(result);
  };

  const submitBill = async (billId: string) => {
    await costaClient.submitForApproval(billId);
    toast({ title: "Submitted for approval" });
    loadBills();
  };

  const approveBill = async (billId: string) => {
    const result = await handleStepUpRetry(() => costaClient.approveBill(billId, "Approved via COSTA console"));
    if (result?.approved) { toast({ title: "Bill approved" }); loadBills(); }
  };

  const finalizeBill = async (billId: string) => {
    await costaClient.finalizeBill(billId);
    toast({ title: "Bill finalized and locked" });
    loadBills();
  };

  const issueInvoice = async (billId: string) => {
    const result = await costaClient.issueInvoice(billId);
    toast({ title: "Invoice issued", description: `Invoice: ${result?.invoice_id}` });
  };

  const createPayment = async (billId: string) => {
    const result = await costaClient.createPaymentIntent(billId);
    toast({ title: "Payment intent created", description: `Intent: ${result?.mushex_payment_intent_id}` });
  };

  // ── Tariffs ──
  const loadTariffs = async () => {
    const result = await costaClient.listTariffs();
    setTariffs(result?.tariffs || []);
  };

  const importTariffs = async () => {
    try {
      const lines = csvImport.trim().split("\n").filter(l => l.trim());
      const parsed = lines.map(line => {
        const [tariff_code, msika_code, price, currency] = line.split(",").map(s => s.trim());
        return { tariff_code, msika_code, price: Number(price), currency: currency || "ZAR" };
      });
      const result = await handleStepUpRetry(() => costaClient.importTariffs(parsed));
      if (result?.imported) { toast({ title: `Imported ${result.imported} tariffs` }); loadTariffs(); setCsvImport(""); }
    } catch (e: any) {
      toast({ title: "Import error", description: e.message, variant: "destructive" });
    }
  };

  // ── Rulesets ──
  const loadRulesets = async () => {
    const result = await costaClient.listRulesets();
    setRulesets(result?.rulesets || []);
  };

  // ── Audit ──
  const loadAudit = async () => {
    if (!auditBillId) return;
    const result = await costaClient.getBillAudit(auditBillId);
    setAuditEntries(result?.entries || []);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Calculator className="h-8 w-8 text-primary" />
              COSTA Console
            </h1>
            <p className="text-muted-foreground mt-1">Impilo Costing Engine v1.1 — Executable Reference</p>
          </div>
          <Badge variant="outline" className="text-xs">v1.1 Lovable Reference</Badge>
        </div>

        {stepUpRequired && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="flex items-center gap-3 py-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span className="text-destructive font-medium">Step-Up Authentication Required — High-risk action detected</span>
              <Button size="sm" variant="destructive" onClick={() => setStepUpRequired(false)}>
                <Shield className="h-4 w-4 mr-1" /> Simulate Step-Up
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="simulate"><Calculator className="h-4 w-4 mr-1" />Simulate</TabsTrigger>
            <TabsTrigger value="bills" onClick={loadBills}><Receipt className="h-4 w-4 mr-1" />Bills</TabsTrigger>
            <TabsTrigger value="tariffs" onClick={loadTariffs}><FileText className="h-4 w-4 mr-1" />Tariffs</TabsTrigger>
            <TabsTrigger value="rulesets" onClick={loadRulesets}><Settings className="h-4 w-4 mr-1" />Rulesets</TabsTrigger>
            <TabsTrigger value="config"><Shield className="h-4 w-4 mr-1" />Config</TabsTrigger>
            <TabsTrigger value="audit"><Activity className="h-4 w-4 mr-1" />Audit</TabsTrigger>
          </TabsList>

          {/* ── SIMULATE TAB ── */}
          <TabsContent value="simulate" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cost/Charge Estimator</CardTitle>
                <CardDescription>Run POST /v1/estimate with sample contexts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Scenario</Label>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => setSimLines([
                      { msika_code: "CONS-001", kind: "SERVICE", qty: 1, cost_method: "TARIFF" },
                      { msika_code: "LAB-CBC", kind: "SERVICE", qty: 1, cost_method: "TARIFF" },
                      { msika_code: "PARA-500", kind: "PRODUCT", qty: 10, cost_method: "TARIFF" },
                    ])}>OPD: Consult + Lab + Pharmacy</Button>
                    <Button size="sm" variant="outline" onClick={() => setSimLines([
                      { msika_code: "BED-GEN", kind: "BEDDAY", qty: 5, cost_method: "MICRO", drivers: { bed_days: 5 } },
                      { msika_code: "FOOD-STD", kind: "FOOD", qty: 5, cost_method: "STANDARD" },
                      { msika_code: "LAUNDRY", kind: "LAUNDRY", qty: 5, cost_method: "STANDARD" },
                      { msika_code: "THEATRE-MIN", kind: "THEATRE", qty: 90, cost_method: "ABC", drivers: { theatre_minutes: 90 } },
                    ])}>Inpatient: Bed + Food + Laundry + Theatre</Button>
                    <Button size="sm" variant="outline" onClick={() => setSimLines([
                      { msika_code: "TRANSPORT", kind: "TRANSPORT", qty: 1, cost_method: "TARIFF" },
                      { msika_code: "PER-DIEM", kind: "PER_DIEM", qty: 1, cost_method: "STANDARD" },
                      { msika_code: "COLD-CHAIN", kind: "COLD_CHAIN", qty: 1, cost_method: "TARIFF" },
                    ])}>Outreach: Transport + Per Diem + Cold Chain</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Lines (JSON)</Label>
                  <Textarea value={JSON.stringify(simLines, null, 2)} onChange={e => { try { setSimLines(JSON.parse(e.target.value)); } catch {} }} rows={6} className="font-mono text-xs" />
                </div>

                <div className="flex gap-2">
                  <Button onClick={runEstimate} disabled={simLoading}>{simLoading ? "Computing..." : "Run Estimate"}</Button>
                  {simResult && <Button variant="secondary" onClick={createDraftFromEstimate} disabled={billLoading}>Create Draft Bill</Button>}
                </div>

                {simResult && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Total Cost</p><p className="text-2xl font-bold">{simResult.totals?.cost?.toFixed(2)}</p></CardContent></Card>
                      <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Total Charge</p><p className="text-2xl font-bold">{simResult.totals?.charge?.toFixed(2)}</p></CardContent></Card>
                      <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Patient Pays</p><p className="text-2xl font-bold">{simResult.allocation?.patient_amount?.toFixed(2)}</p></CardContent></Card>
                    </div>
                    <ScrollArea className="h-64 border rounded p-2">
                      <pre className="text-xs font-mono">{JSON.stringify(simResult, null, 2)}</pre>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── BILLS TAB ── */}
          <TabsContent value="bills" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle>Bills Queue</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Bill ID</TableHead><TableHead>Status</TableHead><TableHead>Total</TableHead><TableHead>Actions</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {bills.map((b: any) => (
                        <TableRow key={b.bill_id} className="cursor-pointer" onClick={() => viewBill(b.bill_id)}>
                          <TableCell className="font-mono text-xs">{b.bill_id?.slice(0, 12)}...</TableCell>
                          <TableCell><Badge variant={b.status === "FINAL" ? "default" : "secondary"}>{b.status}</Badge></TableCell>
                          <TableCell>{(b.totals as any)?.charge?.toFixed(2) || "0.00"}</TableCell>
                          <TableCell className="space-x-1">
                            {b.status === "DRAFT" && <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); submitBill(b.bill_id); }}>Submit</Button>}
                            {b.status === "APPROVAL_PENDING" && <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); approveBill(b.bill_id); }}>Approve</Button>}
                            {(b.status === "DRAFT" || b.status === "APPROVAL_PENDING") && <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); finalizeBill(b.bill_id); }}>Finalize</Button>}
                            {b.status === "FINAL" && <>
                              <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); issueInvoice(b.bill_id); }}>Invoice</Button>
                              <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); createPayment(b.bill_id); }}>Pay</Button>
                            </>}
                          </TableCell>
                        </TableRow>
                      ))}
                      {bills.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No bills. Create one from Simulate tab.</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Bill Detail (Explainable)</CardTitle></CardHeader>
                <CardContent>
                  {selectedBill ? (
                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge>{selectedBill.status}</Badge>
                          <span className="font-mono text-xs">{selectedBill.bill_id}</span>
                        </div>
                        {(selectedBill.lines || []).map((line: any, i: number) => (
                          <Card key={i} className="bg-muted/30">
                            <CardContent className="pt-3 space-y-1">
                              <div className="flex justify-between">
                                <span className="font-medium text-sm">{line.msika_code} ({line.kind})</span>
                                <span className="font-bold">{Number(line.amount).toFixed(2)}</span>
                              </div>
                              <details className="text-xs">
                                <summary className="cursor-pointer text-muted-foreground">Cost Trace</summary>
                                <pre className="mt-1 font-mono">{JSON.stringify(line.cost_trace, null, 2)}</pre>
                              </details>
                              <details className="text-xs">
                                <summary className="cursor-pointer text-muted-foreground">Charge Trace</summary>
                                <pre className="mt-1 font-mono">{JSON.stringify(line.charge_trace, null, 2)}</pre>
                              </details>
                            </CardContent>
                          </Card>
                        ))}
                        <div className="border-t pt-2">
                          <p className="text-sm font-medium">Parties</p>
                          {(selectedBill.parties || []).map((p: any, i: number) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span>{p.party_type}</span><span className="font-bold">{Number(p.amount).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </ScrollArea>
                  ) : (
                    <p className="text-muted-foreground text-sm">Select a bill to view details with cost/charge traces.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── TARIFFS TAB ── */}
          <TabsContent value="tariffs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tariff Management</CardTitle>
                <CardDescription>CSV Import: tariff_code, msika_code, price, currency</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea placeholder="CONS-001,CONS-001,150,ZAR&#10;LAB-CBC,LAB-CBC,85,ZAR" value={csvImport} onChange={e => setCsvImport(e.target.value)} rows={4} className="font-mono text-sm" />
                <Button onClick={importTariffs} disabled={!csvImport.trim()}>
                  <Shield className="h-4 w-4 mr-1" /> Import Tariffs (Step-Up)
                </Button>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Code</TableHead><TableHead>MSIKA</TableHead><TableHead>Price</TableHead><TableHead>Currency</TableHead><TableHead>Effective</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {tariffs.map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono">{t.tariff_code}</TableCell>
                        <TableCell>{t.msika_code}</TableCell>
                        <TableCell>{Number(t.price).toFixed(2)}</TableCell>
                        <TableCell>{t.currency}</TableCell>
                        <TableCell className="text-xs">{t.effective_from?.slice(0, 10)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── RULESETS TAB ── */}
          <TabsContent value="rulesets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Charging Ruleset Editor</CardTitle>
                <CardDescription>JSON rules with schema validation and dry-run</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea value={rulesetJson} onChange={e => setRulesetJson(e.target.value)} rows={10} className="font-mono text-sm" />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { try { JSON.parse(rulesetJson); toast({ title: "Valid JSON" }); } catch { toast({ title: "Invalid JSON", variant: "destructive" }); } }}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Validate
                  </Button>
                  <Button variant="outline" onClick={runEstimate}>Dry Run (uses Simulate lines)</Button>
                </div>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Name</TableHead><TableHead>Version</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {rulesets.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.name}</TableCell>
                        <TableCell>{r.version}</TableCell>
                        <TableCell><Badge>{r.status}</Badge></TableCell>
                        <TableCell>
                          {r.status === "DRAFT" && <Button size="sm" onClick={() => handleStepUpRetry(() => costaClient.publishRuleset(r.id))}>Publish</Button>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── CONFIG TAB ── */}
          <TabsContent value="config" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle>Exemption Rules</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">Age band, category-based waivers. Age is a boolean input — no DOB stored.</p>
                  <Button variant="outline" onClick={async () => { const r = await costaClient.listExemptions(); toast({ title: `${r?.rules?.length || 0} exemption rules found` }); }}>Load Rules</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Insurance Plans</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">Coverage %, caps, deductibles, copay, prior auth flag.</p>
                  <Button variant="outline" onClick={async () => { const r = await costaClient.listInsurancePlans(); toast({ title: `${r?.plans?.length || 0} insurance plans found` }); }}>Load Plans</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── AUDIT TAB ── */}
          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Audit Explorer</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Bill ID" value={auditBillId} onChange={e => setAuditBillId(e.target.value)} className="max-w-xs" />
                  <Button onClick={loadAudit}>Search</Button>
                </div>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Action</TableHead><TableHead>Actor</TableHead><TableHead>Time</TableHead><TableHead>Details</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {auditEntries.map((e: any) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-mono text-xs">{e.action}</TableCell>
                        <TableCell>{e.actor_id} ({e.actor_type})</TableCell>
                        <TableCell className="text-xs">{e.created_at?.slice(0, 19)}</TableCell>
                        <TableCell className="text-xs max-w-xs truncate">{JSON.stringify(e.details)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
