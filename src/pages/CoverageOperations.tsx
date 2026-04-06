import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Shield, Users, CreditCard, FileText, CheckCircle, XCircle, Clock, AlertTriangle,
  Building, BarChart3, DollarSign, HeartPulse, UserCheck, Landmark, Briefcase,
  Search, Plus, ArrowRightLeft, FileCheck, Wallet, TrendingUp, Scale, Activity,
  ChevronDown, ChevronUp, Globe, Heart, Banknote, HandCoins
} from "lucide-react";
import { MembershipTab } from "@/components/coverage/MembershipTab";
import { ProviderContractingTab } from "@/components/coverage/ProviderContractingTab";
import { PreauthTab } from "@/components/coverage/PreauthTab";
import { ContributionsTab } from "@/components/coverage/ContributionsTab";
import { SettlementTab } from "@/components/coverage/SettlementTab";
import { AppealsTab } from "@/components/coverage/AppealsTab";
import { PayerIntelligenceTab } from "@/components/coverage/PayerIntelligenceTab";
import { useState } from "react";
import { toast } from "sonner";

const SAMPLE_SCHEMES = [
  { id: "SCH-001", name: "National Health Insurance Scheme", type: "Government", subtype: "Social Health Insurance", members: 4200000, status: "active", funding: "Tax-based + Contributions", pools: 3 },
  { id: "SCH-002", name: "CIMAS Medical Aid Society", type: "Medical Aid", subtype: "Private Insurance", members: 320000, status: "active", funding: "$85/month premium", pools: 5 },
  { id: "SCH-003", name: "First Mutual Health", type: "Medical Aid", subtype: "Private Insurance", members: 180000, status: "active", funding: "$72/month premium", pools: 4 },
  { id: "SCH-004", name: "Corporate Wellness Programme", type: "Employer", subtype: "Employer-Funded", members: 45000, status: "active", funding: "$40/month employer contribution", pools: 2 },
  { id: "SCH-005", name: "PEPFAR Zimbabwe", type: "Donor", subtype: "Bilateral Aid", members: 890000, status: "active", funding: "Grant-funded", pools: 1 },
  { id: "SCH-006", name: "Global Fund HIV/TB/Malaria", type: "Donor", subtype: "Multilateral", members: 1200000, status: "active", funding: "Grant-funded", pools: 3 },
  { id: "SCH-007", name: "Community Health Fund — Masvingo", type: "Community", subtype: "Mutual Health Pool", members: 18000, status: "active", funding: "$5/month community levy", pools: 1 },
  { id: "SCH-008", name: "Ministry of Health — Free Services", type: "Government", subtype: "Direct Budget", members: 14000000, status: "active", funding: "Treasury allocation", pools: 1 },
  { id: "SCH-009", name: "Catholic Health Association", type: "Faith-Based", subtype: "Mission Hospital Network", members: 95000, status: "active", funding: "Donations + Subsidised fees", pools: 2 },
  { id: "SCH-010", name: "Self-Pay / Out-of-Pocket", type: "Individual", subtype: "Direct Payment", members: 0, status: "active", funding: "Patient self-funded", pools: 0 },
  { id: "SCH-011", name: "Social Protection Fund — Vulnerable", type: "Government", subtype: "Social Assistance", members: 350000, status: "active", funding: "Government + Donor", pools: 1 },
];

const SAMPLE_CLAIMS = [
  { id: "CLM-2026-00142", patient: "CPID-abc123", payer: "CIMAS", payerType: "Medical Aid", service: "Outpatient Consultation", amount: 45.00, status: "approved", submitted: "2026-03-08", adjudicated: "2026-03-08" },
  { id: "CLM-2026-00143", patient: "CPID-def456", payer: "NHIS", payerType: "Government", service: "Lab - Full Blood Count", amount: 22.00, status: "provisionally_adjudicated", submitted: "2026-03-09", adjudicated: null },
  { id: "CLM-2026-00144", patient: "CPID-ghi789", payer: "PEPFAR", payerType: "Donor", service: "ART Regimen — TLD", amount: 120.00, status: "approved", submitted: "2026-03-07", adjudicated: "2026-03-07" },
  { id: "CLM-2026-00145", patient: "CPID-jkl012", payer: "Self-Pay", payerType: "Individual", service: "Pharmacy - Amoxicillin", amount: 12.50, status: "paid", submitted: "2026-03-06", adjudicated: "2026-03-06" },
  { id: "CLM-2026-00146", patient: "CPID-mno345", payer: "Global Fund", payerType: "Donor", service: "TB Sputum GeneXpert", amount: 35.00, status: "remitted", submitted: "2026-03-05", adjudicated: "2026-03-05" },
  { id: "CLM-2026-00147", patient: "CPID-pqr678", payer: "Community Health Fund", payerType: "Community", service: "Maternity - Normal Delivery", amount: 80.00, status: "approved", submitted: "2026-03-04", adjudicated: "2026-03-04" },
  { id: "CLM-2026-00148", patient: "CPID-stu901", payer: "Catholic Health Assn", payerType: "Faith-Based", service: "Surgery - Hernia Repair", amount: 350.00, status: "preauthorized", submitted: "2026-03-03", adjudicated: null },
  { id: "CLM-2026-00149", patient: "CPID-vwx234", payer: "Delta Corporation", payerType: "Employer", service: "Radiology - Chest X-Ray", amount: 35.00, status: "remitted", submitted: "2026-03-02", adjudicated: "2026-03-02" },
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

const payerTypeBadge = (type: string) => {
  const map: Record<string, string> = {
    Government: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    "Medical Aid": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    Donor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    Employer: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    Community: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    "Faith-Based": "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
    Individual: "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400",
  };
  return <Badge className={map[type] || "bg-muted text-muted-foreground"}>{type}</Badge>;
};

const claimStatusBadge = (status: string) => {
  const map: Record<string, string> = {
    approved: "bg-green-100 text-green-700",
    denied: "bg-red-100 text-red-700",
    provisionally_adjudicated: "bg-purple-100 text-purple-700",
    preauthorized: "bg-cyan-100 text-cyan-700",
    remitted: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    paid: "bg-green-100 text-green-700",
  };
  return <Badge className={map[status] || "bg-gray-100 text-gray-700"}>{status.replace(/_/g, " ")}</Badge>;
};

export default function CoverageOperations() {
  const [showNewScheme, setShowNewScheme] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<string | null>(null);
  const [schemeSearch, setSchemeSearch] = useState("");
  const [claimDecisions, setClaimDecisions] = useState<Record<string, string>>({});

  const filteredSchemes = SAMPLE_SCHEMES.filter(s =>
    !schemeSearch || s.name.toLowerCase().includes(schemeSearch.toLowerCase()) || s.type.toLowerCase().includes(schemeSearch.toLowerCase())
  );

  const handleSchemeCreate = () => {
    toast.success("Scheme created", { description: "New financing scheme has been registered and is pending activation." });
    setShowNewScheme(false);
  };

  const handleClaimAction = (claimId: string, action: string) => {
    const labels: Record<string, string> = {
      approve: "Claim approved and queued for settlement",
      deny: "Claim denied — appellant may file appeal",
      adjudicate: "Claim sent to adjudication queue",
      request_info: "Additional information requested from provider",
      escalate: "Claim escalated to senior reviewer",
    };
    toast.success(labels[action] || "Action completed", { description: `Claim ${claimId} updated successfully.` });
    setSelectedClaim(null);
  };

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
              All health financing actors — government, donors, insurers, employers, communities, faith-based organisations, and individuals
            </p>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex w-max">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="schemes">Schemes & Financiers</TabsTrigger>
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
              {/* Payer Type Distribution */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                  { icon: Landmark, value: "14.6M", label: "Government Covered", color: "text-blue-600" },
                  { icon: Globe, value: "2.1M", label: "Donor-Funded", color: "text-emerald-600" },
                  { icon: Shield, value: "500K", label: "Medical Aid", color: "text-purple-600" },
                  { icon: Briefcase, value: "45K", label: "Employer Schemes", color: "text-cyan-600" },
                  { icon: Heart, value: "95K", label: "Faith-Based", color: "text-pink-600" },
                  { icon: HandCoins, value: "18K", label: "Community Pools", color: "text-amber-600" },
                  { icon: Banknote, value: "~6M", label: "Self-Pay / OOP", color: "text-muted-foreground" },
                ].map((kpi, i) => (
                  <Card key={i}>
                    <CardContent className="p-3 text-center">
                      <kpi.icon className={`h-4 w-4 mx-auto mb-1 ${kpi.color}`} />
                      <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
                      <p className="text-[9px] text-muted-foreground leading-tight">{kpi.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {[
                  { icon: FileText, value: "12,456", label: "Claims This Month", color: "text-info" },
                  { icon: DollarSign, value: "$2.8M", label: "Settled This Month", color: "text-success" },
                  { icon: CheckCircle, value: "94.2%", label: "Approval Rate", color: "text-success" },
                  { icon: Clock, value: "2.3d", label: "Avg Settlement", color: "text-primary" },
                  { icon: AlertTriangle, value: "0.8%", label: "Fraud Rate", color: "text-destructive" },
                  { icon: ArrowRightLeft, value: "$1.2M", label: "Donor Disbursed", color: "text-emerald-600" },
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
                  <CardDescription>13-state settlement lifecycle — all payer types</CardDescription>
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
                    <CardTitle>Financing Schemes & Payer Registry</CardTitle>
                    <CardDescription>All health financing mechanisms — government budgets, insurance, donor programmes, community pools, employer schemes, faith-based, and self-pay</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-2.5 top-2 text-muted-foreground" />
                      <Input placeholder="Search schemes..." className="pl-8 h-8 w-[200px] text-xs" value={schemeSearch} onChange={e => setSchemeSearch(e.target.value)} />
                    </div>
                    <Button className="gap-2" onClick={() => setShowNewScheme(!showNewScheme)}>
                      <Plus className="h-4 w-4" /> Register Scheme
                      {showNewScheme ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {showNewScheme && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-sm mb-3">Register New Financing Scheme</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div><Label className="text-xs">Scheme / Programme Name</Label><Input placeholder="e.g. District Health Fund" className="h-8 text-xs" /></div>
                        <div>
                          <Label className="text-xs">Payer Type</Label>
                          <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select type" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="government">Government (National/Provincial/District)</SelectItem>
                              <SelectItem value="social_insurance">Social Health Insurance</SelectItem>
                              <SelectItem value="medical_aid">Medical Aid Society / Private Insurance</SelectItem>
                              <SelectItem value="donor_bilateral">Donor — Bilateral (e.g. PEPFAR, DFID)</SelectItem>
                              <SelectItem value="donor_multilateral">Donor — Multilateral (e.g. Global Fund, WHO)</SelectItem>
                              <SelectItem value="employer">Employer / Corporate</SelectItem>
                              <SelectItem value="community">Community Health Fund / Mutual Pool</SelectItem>
                              <SelectItem value="faith_based">Faith-Based Organisation</SelectItem>
                              <SelectItem value="ngo">NGO / Civil Society</SelectItem>
                              <SelectItem value="individual">Individual / Self-Pay</SelectItem>
                              <SelectItem value="social_protection">Social Protection / Safety Net</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Funding Mechanism</Label>
                          <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select mechanism" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tax">Tax-Based (General Revenue)</SelectItem>
                              <SelectItem value="premium">Premium / Contribution-Based</SelectItem>
                              <SelectItem value="grant">Grant / Donation</SelectItem>
                              <SelectItem value="levy">Community Levy / Co-operative</SelectItem>
                              <SelectItem value="employer_contribution">Employer Contribution</SelectItem>
                              <SelectItem value="oop">Out-of-Pocket</SelectItem>
                              <SelectItem value="mixed">Mixed / Blended</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div><Label className="text-xs">Governing Body / Authority</Label><Input placeholder="e.g. Ministry of Health" className="h-8 text-xs" /></div>
                        <div><Label className="text-xs">Coverage Population</Label><Input placeholder="e.g. All citizens, Employees, ART patients" className="h-8 text-xs" /></div>
                        <div><Label className="text-xs">Benefit Package</Label><Input placeholder="e.g. Essential Health Package" className="h-8 text-xs" /></div>
                      </div>
                      <div className="mt-3"><Label className="text-xs">Description & Mandate</Label><Textarea placeholder="Describe the scheme's mandate, target population, and key services covered..." className="text-xs min-h-[60px]" /></div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" onClick={handleSchemeCreate}>Register Scheme</Button>
                        <Button size="sm" variant="outline" onClick={() => setShowNewScheme(false)}>Cancel</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Scheme / Programme</TableHead>
                      <TableHead>Payer Type</TableHead>
                      <TableHead>Sub-Type</TableHead>
                      <TableHead>Covered Pop.</TableHead>
                      <TableHead>Funding</TableHead>
                      <TableHead>Pools</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSchemes.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.id}</TableCell>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{payerTypeBadge(s.type)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{s.subtype}</TableCell>
                        <TableCell>{s.members > 0 ? s.members.toLocaleString() : "—"}</TableCell>
                        <TableCell className="text-xs">{s.funding}</TableCell>
                        <TableCell>{s.pools}</TableCell>
                        <TableCell><Badge className="bg-success/10 text-success">{s.status}</Badge></TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => toast.info(`Managing ${s.name}`, { description: "Opening scheme configuration..." })}>
                            Manage
                          </Button>
                        </TableCell>
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
                <CardDescription>F1 — Immediate verification across all payer types: government, donor, insurance, community, employer, and self-pay</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-success/20 bg-success/5">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-sm mb-3">Real-Time Eligibility Check</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Eligibility</span><Badge className="bg-success/10 text-success">Verified ✓</Badge></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Payer Type</span><Badge className="bg-purple-100 text-purple-700">Medical Aid</Badge></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Contracted Provider</span><Badge className="bg-success/10 text-success">Verified ✓</Badge></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Benefit Package</span><Badge className="bg-success/10 text-success">Gold Plan</Badge></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Exclusions</span><Badge className="bg-success/10 text-success">None</Badge></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Waiting Period</span><Badge className="bg-success/10 text-success">Completed</Badge></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Preauth Required</span><Badge className="bg-warning/10 text-warning">Yes — Surgery</Badge></div>
                        <hr className="my-2" />
                        <div className="flex justify-between font-medium"><span>Member Liability</span><span>$45.00 (co-pay)</span></div>
                        <div className="flex justify-between font-medium"><span>Payer Liability</span><span>$455.00</span></div>
                      </div>
                      <Button size="sm" className="mt-3 w-full" onClick={() => toast.success("Eligibility verified", { description: "Patient is eligible for services under Gold Plan. Co-pay: $45.00" })}>
                        Run Eligibility Check
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-sm mb-3">Guarantee of Payment</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">GOP Reference</span><span className="font-mono">GOP-2026-00892</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className="bg-primary/10 text-primary">Reserved</Badge></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Payer</span><span>CIMAS (Medical Aid)</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Amount Reserved</span><span className="font-medium">$500.00</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Expires</span><span>2026-03-15T23:59:59Z</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Approval</span><Badge className="bg-success/10 text-success">Provisional</Badge></div>
                        <hr className="my-2" />
                        <p className="text-xs text-muted-foreground">Financial class: F1 — Synchronous authoritative validation</p>
                      </div>
                      <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => toast.success("GOP issued", { description: "Guarantee of Payment GOP-2026-00893 reserved $500.00 for 30 days." })}>
                        Issue New GOP
                      </Button>
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
                  <Button size="sm" className="gap-1" onClick={() => toast.info("New claim form opened")}><Plus className="h-3.5 w-3.5" /> Submit Claim</Button>
                </div>
                <CardDescription>Claims from all payer types — government, donor, insurance, employer, community, faith-based, and self-pay receipting</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim ID</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Payer</TableHead>
                      <TableHead>Payer Type</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SAMPLE_CLAIMS.map(c => (
                      <>
                        <TableRow key={c.id} className={selectedClaim === c.id ? "bg-primary/5" : ""}>
                          <TableCell className="font-mono text-xs">{c.id}</TableCell>
                          <TableCell className="font-mono text-xs">{c.patient}</TableCell>
                          <TableCell className="font-medium">{c.payer}</TableCell>
                          <TableCell>{payerTypeBadge(c.payerType)}</TableCell>
                          <TableCell className="text-xs">{c.service}</TableCell>
                          <TableCell className="font-mono">${c.amount.toFixed(2)}</TableCell>
                          <TableCell>{claimStatusBadge(c.status)}</TableCell>
                          <TableCell className="text-xs">{c.submitted}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setSelectedClaim(selectedClaim === c.id ? null : c.id)}>
                              {selectedClaim === c.id ? "Close" : "Review"}
                            </Button>
                          </TableCell>
                        </TableRow>
                        {selectedClaim === c.id && (
                          <TableRow key={c.id + "-review"}>
                            <TableCell colSpan={9}>
                              <div className="p-3 bg-muted/30 rounded-lg space-y-3">
                                <h4 className="text-sm font-semibold">Claim Review — {c.id}</h4>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                  <div className="p-2 bg-background rounded border">
                                    <strong>Service:</strong> {c.service}<br />
                                    <strong>Payer:</strong> {c.payer} ({c.payerType})<br />
                                    <strong>Amount Claimed:</strong> ${c.amount.toFixed(2)}
                                  </div>
                                  <div className="space-y-2">
                                    <div>
                                      <Label className="text-xs">Decision</Label>
                                      <Select onValueChange={(v) => setClaimDecisions(prev => ({...prev, [c.id]: v}))}>
                                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select decision" /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="approve">Approve</SelectItem>
                                          <SelectItem value="deny">Deny</SelectItem>
                                          <SelectItem value="adjudicate">Send to Adjudication</SelectItem>
                                          <SelectItem value="request_info">Request More Info</SelectItem>
                                          <SelectItem value="escalate">Escalate</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div><Label className="text-xs">Review Notes</Label><Textarea placeholder="Notes..." className="text-xs min-h-[40px]" /></div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleClaimAction(c.id, claimDecisions[c.id] || "approve")}>Submit Decision</Button>
                                  <Button size="sm" variant="outline" onClick={() => toast.info("Patient history loaded")}>View Patient History</Button>
                                  <Button size="sm" variant="outline" onClick={() => toast.info("Coding validation passed")}>Validate Codes</Button>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
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
