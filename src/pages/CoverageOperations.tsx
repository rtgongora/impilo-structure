import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Shield, Users, CreditCard, FileText, CheckCircle, XCircle, Clock, AlertTriangle,
  Building, BarChart3, DollarSign, HeartPulse, UserCheck, Landmark, Briefcase,
  Search, Plus, ArrowRightLeft, FileCheck, Wallet, TrendingUp, Scale, Activity
} from "lucide-react";

const SAMPLE_SCHEMES = [
  { id: "SCH-001", name: "National Health Insurance Scheme", type: "Public", members: 4200000, status: "active", premium: "N/A", pools: 3 },
  { id: "SCH-002", name: "CIMAS Medical Aid", type: "Private", members: 320000, status: "active", premium: "$85/month", pools: 5 },
  { id: "SCH-003", name: "First Mutual Health", type: "Private", members: 180000, status: "active", premium: "$72/month", pools: 4 },
  { id: "SCH-004", name: "Employer Wellness Program", type: "Employer", members: 45000, status: "active", premium: "$40/month", pools: 2 },
];

const SAMPLE_CLAIMS = [
  { id: "CLM-2026-00142", patient: "CPID-abc123", scheme: "CIMAS", service: "Outpatient Consultation", amount: 45.00, status: "approved", submitted: "2026-03-08", adjudicated: "2026-03-08" },
  { id: "CLM-2026-00143", patient: "CPID-def456", scheme: "NHIS", service: "Lab - Full Blood Count", amount: 22.00, status: "provisionally_adjudicated", submitted: "2026-03-09", adjudicated: null },
  { id: "CLM-2026-00144", patient: "CPID-ghi789", scheme: "First Mutual", service: "Theatre - Appendectomy", amount: 2500.00, status: "preauthorized", submitted: "2026-03-07", adjudicated: null },
  { id: "CLM-2026-00145", patient: "CPID-jkl012", scheme: "CIMAS", service: "Pharmacy - Amoxicillin", amount: 12.50, status: "denied", submitted: "2026-03-06", adjudicated: "2026-03-07" },
  { id: "CLM-2026-00146", patient: "CPID-mno345", scheme: "NHIS", service: "Radiology - Chest X-Ray", amount: 35.00, status: "remitted", submitted: "2026-03-05", adjudicated: "2026-03-05" },
];

const SETTLEMENT_STATES = [
  { state: "INITIATED", count: 45, color: "bg-gray-400" },
  { state: "ELIGIBILITY_VERIFIED", count: 38, color: "bg-blue-400" },
  { state: "PREAUTHORIZED", count: 12, color: "bg-cyan-400" },
  { state: "RESERVED", count: 8, color: "bg-indigo-400" },
  { state: "PROVISIONALLY_ADJUDICATED", count: 156, color: "bg-purple-400" },
  { state: "APPROVED", count: 234, color: "bg-green-400" },
  { state: "REMITTED", count: 189, color: "bg-emerald-400" },
  { state: "PAID", count: 1245, color: "bg-green-600" },
  { state: "SETTLED", count: 3456, color: "bg-green-700" },
  { state: "REVERSED", count: 12, color: "bg-red-400" },
  { state: "RECONCILED", count: 2890, color: "bg-teal-500" },
  { state: "DISPUTED", count: 7, color: "bg-orange-400" },
  { state: "RECOVERED", count: 3, color: "bg-rose-500" },
];

const claimStatusBadge = (status: string) => {
  const map: Record<string, string> = {
    approved: "bg-green-100 text-green-700",
    denied: "bg-red-100 text-red-700",
    provisionally_adjudicated: "bg-purple-100 text-purple-700",
    preauthorized: "bg-cyan-100 text-cyan-700",
    remitted: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
  };
  return <Badge className={map[status] || "bg-gray-100 text-gray-700"}>{status.replace(/_/g, " ")}</Badge>;
};

export default function CoverageOperations() {
  return (
    <AppLayout title="Coverage, Financing & Payer Operations">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Coverage, Financing & Payer Operations
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Native platform capability — consuming shared sovereign registries, not a disconnected insurer silo
            </p>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex w-max">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="schemes">Schemes & Products</TabsTrigger>
              <TabsTrigger value="membership">Membership</TabsTrigger>
              <TabsTrigger value="eligibility">Eligibility & Entitlement</TabsTrigger>
              <TabsTrigger value="contracting">Provider Contracting</TabsTrigger>
              <TabsTrigger value="preauth">Preauthorization</TabsTrigger>
              <TabsTrigger value="claims">Claims & Adjudication</TabsTrigger>
              <TabsTrigger value="contributions">Contributions & Billing</TabsTrigger>
              <TabsTrigger value="settlement">Settlement & Remittance</TabsTrigger>
              <TabsTrigger value="appeals">Appeals & Queries</TabsTrigger>
              <TabsTrigger value="intelligence">Payer Intelligence</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <Card><CardContent className="p-4 text-center">
                <Users className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">4.7M</p>
                <p className="text-xs text-muted-foreground">Active Members</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <FileText className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">12,456</p>
                <p className="text-xs text-muted-foreground">Claims This Month</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <DollarSign className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">$2.8M</p>
                <p className="text-xs text-muted-foreground">Settled This Month</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <CheckCircle className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">94.2%</p>
                <p className="text-xs text-muted-foreground">Claim Approval Rate</p>
              </CardContent></Card>
            </div>

            {/* Settlement State Pipeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Settlement Pipeline — Real-Time State Distribution
                </CardTitle>
                <CardDescription>13-state settlement lifecycle per v1.2 spec</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {SETTLEMENT_STATES.map(s => (
                    <div key={s.state} className="flex items-center gap-2 px-3 py-2 border rounded-lg min-w-[140px]">
                      <div className={`w-3 h-3 rounded-full ${s.color}`} />
                      <div>
                        <p className="text-xs font-medium">{s.state.replace(/_/g, " ")}</p>
                        <p className="text-lg font-bold">{s.count.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schemes">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Scheme & Product Administration</CardTitle>
                    <CardDescription>Plans, packages, benefit rules, deductibles, co-pays, ceilings, and formulary rules</CardDescription>
                  </div>
                  <Button className="gap-2"><Plus className="h-4 w-4" /> New Scheme</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Scheme Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Plans</TableHead>
                      <TableHead>Premium</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SAMPLE_SCHEMES.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.id}</TableCell>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell><Badge variant="outline">{s.type}</Badge></TableCell>
                        <TableCell>{s.members.toLocaleString()}</TableCell>
                        <TableCell>{s.pools}</TableCell>
                        <TableCell>{s.premium}</TableCell>
                        <TableCell><Badge className="bg-green-100 text-green-700">{s.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="membership">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Membership & Beneficiary Administration</CardTitle>
                <CardDescription>Member enrollment, beneficiary management, coverage periods — referencing shared VITO identity</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  Membership CRUD, beneficiary enrollment, coverage period management, waiting period tracking
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="eligibility">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Real-Time Eligibility & Entitlement
                </CardTitle>
                <CardDescription>F1 — Immediate hard truth required for service commitment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-green-200 bg-green-50/50">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-sm mb-3">Real-Time Eligibility Check</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Eligibility</span><Badge className="bg-green-100 text-green-700">Verified ✓</Badge></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Contracted Provider</span><Badge className="bg-green-100 text-green-700">Verified ✓</Badge></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Benefit Package</span><Badge className="bg-green-100 text-green-700">Gold Plan</Badge></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Exclusions</span><Badge className="bg-green-100 text-green-700">None</Badge></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Waiting Period</span><Badge className="bg-green-100 text-green-700">Completed</Badge></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Preauth Required</span><Badge className="bg-amber-100 text-amber-700">Yes — Surgery</Badge></div>
                        <hr className="my-2" />
                        <div className="flex justify-between font-medium"><span>Member Liability</span><span>$45.00 (co-pay)</span></div>
                        <div className="flex justify-between font-medium"><span>Payer Liability</span><span>$455.00</span></div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-blue-200 bg-blue-50/50">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-sm mb-3">Guarantee of Payment</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">GOP Reference</span><span className="font-mono">GOP-2026-00892</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className="bg-blue-100 text-blue-700">Reserved</Badge></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Amount Reserved</span><span className="font-medium">$500.00</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Expires</span><span>2026-03-15T23:59:59Z</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Approval</span><Badge className="bg-green-100 text-green-700">Provisional</Badge></div>
                        <hr className="my-2" />
                        <p className="text-xs text-muted-foreground">Financial class: F1 — Synchronous authoritative validation</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracting">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" /> Provider Contracting & Network Management</CardTitle>
                <CardDescription>Contracted networks, rate schedules, reimbursement modes — referencing VARAPI providers</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  Provider contract CRUD, rate schedule management, network tier assignment, sanction tracking
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preauth">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileCheck className="h-5 w-5" /> Preauthorization & Utilization Management</CardTitle>
                <CardDescription>Events: impilo.preauth.requested.v1 / approved.v1 / denied.v1</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  Preauth request/review workflow, utilization review cases, clinical evidence attachment via Landela
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="claims">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Claims Capture & Adjudication</CardTitle>
                <CardDescription>Electronic claims, automated + manual adjudication, coding edits, rule evaluation</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim ID</TableHead>
                      <TableHead>Patient (CPID)</TableHead>
                      <TableHead>Scheme</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Adjudicated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SAMPLE_CLAIMS.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-xs">{c.id}</TableCell>
                        <TableCell className="font-mono text-xs">{c.patient}</TableCell>
                        <TableCell>{c.scheme}</TableCell>
                        <TableCell>{c.service}</TableCell>
                        <TableCell className="font-medium">${c.amount.toFixed(2)}</TableCell>
                        <TableCell>{claimStatusBadge(c.status)}</TableCell>
                        <TableCell>{c.submitted}</TableCell>
                        <TableCell>{c.adjudicated || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contributions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" /> Contributions, Billing & Collections</CardTitle>
                <CardDescription>Premiums, employer billing, receipts, arrears, subsidy linkage</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  Contribution schedule CRUD, receipt recording, arrears tracking, subsidy/co-financing linkage
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settlement">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ArrowRightLeft className="h-5 w-5" /> Provider Payments, Remittance & Settlement</CardTitle>
                <CardDescription>Payment batches, remittance advice, capitation/FFS payout, recovery/clawback</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Settlement State Pipeline Visual */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-2">
                    {SETTLEMENT_STATES.map((s, i) => (
                      <div key={s.state} className="flex items-center">
                        <div className={`px-2 py-1 rounded text-xs font-medium text-white ${s.color} whitespace-nowrap`}>
                          {s.state.replace(/_/g, " ")}
                        </div>
                        {i < SETTLEMENT_STATES.length - 1 && <span className="text-muted-foreground mx-1">→</span>}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Full settlement lifecycle management with reversal, refund, recovery, and reconciliation handling
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appeals">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5" /> Appeals, Complaints & Queries</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  Claim appeals, member/provider complaints, query management, dispute resolution
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="intelligence">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Purchaser / Payer Intelligence</CardTitle>
                <CardDescription>Analytics, fraud detection, utilization patterns, cost optimization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold">$127</p>
                    <p className="text-xs text-muted-foreground">Avg Claim Value</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold">2.3 days</p>
                    <p className="text-xs text-muted-foreground">Avg Settlement Time</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-500">0.8%</p>
                    <p className="text-xs text-muted-foreground">Fraud Flag Rate</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold">78%</p>
                    <p className="text-xs text-muted-foreground">Medical Loss Ratio</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
