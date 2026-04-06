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
import { MembershipTab } from "@/components/coverage/MembershipTab";
import { ProviderContractingTab } from "@/components/coverage/ProviderContractingTab";
import { PreauthTab } from "@/components/coverage/PreauthTab";
import { ContributionsTab } from "@/components/coverage/ContributionsTab";
import { SettlementTab } from "@/components/coverage/SettlementTab";
import { AppealsTab } from "@/components/coverage/AppealsTab";
import { PayerIntelligenceTab } from "@/components/coverage/PayerIntelligenceTab";

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
  { state: "INITIATED", count: 45 }, { state: "ELIGIBILITY_VERIFIED", count: 38 },
  { state: "PREAUTHORIZED", count: 12 }, { state: "RESERVED", count: 8 },
  { state: "PROV_ADJUDICATED", count: 156 }, { state: "APPROVED", count: 234 },
  { state: "REMITTED", count: 189 }, { state: "PAID", count: 1245 },
  { state: "SETTLED", count: 3456 }, { state: "REVERSED", count: 12 },
  { state: "RECONCILED", count: 2890 }, { state: "DISPUTED", count: 7 },
  { state: "RECOVERED", count: 3 },
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
              <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
              <TabsTrigger value="contracting">Contracting</TabsTrigger>
              <TabsTrigger value="preauth">Preauthorization</TabsTrigger>
              <TabsTrigger value="claims">Claims</TabsTrigger>
              <TabsTrigger value="contributions">Contributions</TabsTrigger>
              <TabsTrigger value="settlement">Settlement</TabsTrigger>
              <TabsTrigger value="appeals">Appeals</TabsTrigger>
              <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard">
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {[
                  { icon: Users, value: "4.7M", label: "Active Members", color: "text-primary" },
                  { icon: FileText, value: "12,456", label: "Claims This Month", color: "text-info" },
                  { icon: DollarSign, value: "$2.8M", label: "Settled This Month", color: "text-success" },
                  { icon: CheckCircle, value: "94.2%", label: "Approval Rate", color: "text-success" },
                  { icon: Clock, value: "2.3d", label: "Avg Settlement", color: "text-primary" },
                  { icon: AlertTriangle, value: "0.8%", label: "Fraud Rate", color: "text-destructive" },
                ].map((kpi, i) => (
                  <Card key={i}>
                    <CardContent className="p-3 text-center">
                      <kpi.icon className={`h-5 w-5 mx-auto mb-1.5 ${kpi.color}`} />
                      <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                      <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" /> Settlement Pipeline</CardTitle>
                  <CardDescription>13-state settlement lifecycle — real-time distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {SETTLEMENT_STATES.map(s => (
                      <div key={s.state} className="flex items-center gap-2 px-3 py-2 border rounded-lg min-w-[120px]">
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground">{s.state.replace(/_/g, " ")}</p>
                          <p className="text-lg font-bold">{s.count.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
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
                      <TableHead></TableHead>
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
                        <TableCell><Badge className="bg-success/10 text-success">{s.status}</Badge></TableCell>
                        <TableCell><Button variant="outline" size="sm" className="h-7 text-xs">Manage</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="membership"><MembershipTab /></TabsContent>

          <TabsContent value="eligibility">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5" /> Real-Time Eligibility & Entitlement</CardTitle>
                <CardDescription>F1 — Immediate hard truth required for service commitment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-success/20 bg-success/5">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-sm mb-3">Real-Time Eligibility Check</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Eligibility</span><Badge className="bg-success/10 text-success">Verified ✓</Badge></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Contracted Provider</span><Badge className="bg-success/10 text-success">Verified ✓</Badge></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Benefit Package</span><Badge className="bg-success/10 text-success">Gold Plan</Badge></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Exclusions</span><Badge className="bg-success/10 text-success">None</Badge></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Waiting Period</span><Badge className="bg-success/10 text-success">Completed</Badge></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Preauth Required</span><Badge className="bg-warning/10 text-warning">Yes — Surgery</Badge></div>
                        <hr className="my-2" />
                        <div className="flex justify-between font-medium"><span>Member Liability</span><span>$45.00 (co-pay)</span></div>
                        <div className="flex justify-between font-medium"><span>Payer Liability</span><span>$455.00</span></div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-sm mb-3">Guarantee of Payment</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">GOP Reference</span><span className="font-mono">GOP-2026-00892</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className="bg-primary/10 text-primary">Reserved</Badge></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Amount Reserved</span><span className="font-medium">$500.00</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Expires</span><span>2026-03-15T23:59:59Z</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Approval</span><Badge className="bg-success/10 text-success">Provisional</Badge></div>
                        <hr className="my-2" />
                        <p className="text-xs text-muted-foreground">Financial class: F1 — Synchronous authoritative validation</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracting"><ProviderContractingTab /></TabsContent>
          <TabsContent value="preauth"><PreauthTab /></TabsContent>

          <TabsContent value="claims">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Claims Capture & Adjudication</CardTitle>
                  <Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> Submit Claim</Button>
                </div>
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
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SAMPLE_CLAIMS.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-xs">{c.id}</TableCell>
                        <TableCell className="font-mono text-xs">{c.patient}</TableCell>
                        <TableCell>{c.scheme}</TableCell>
                        <TableCell className="font-medium">{c.service}</TableCell>
                        <TableCell className="font-mono">${c.amount.toFixed(2)}</TableCell>
                        <TableCell>{claimStatusBadge(c.status)}</TableCell>
                        <TableCell className="text-xs">{c.submitted}</TableCell>
                        <TableCell className="text-xs">{c.adjudicated || "—"}</TableCell>
                        <TableCell><Button variant="outline" size="sm" className="h-7 text-xs">Review</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contributions"><ContributionsTab /></TabsContent>
          <TabsContent value="settlement"><SettlementTab /></TabsContent>
          <TabsContent value="appeals"><AppealsTab /></TabsContent>
          <TabsContent value="intelligence"><PayerIntelligenceTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
