import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign, FileText, CreditCard, AlertCircle, CheckCircle2,
  Clock, TrendingUp, Receipt, Send, Eye, BarChart3, XCircle
} from "lucide-react";
import { toast } from "sonner";

type BillingTab = 'charges' | 'invoices' | 'claims' | 'payments' | 'overview';

const UNBILLED_CHARGES = [
  { id: 'CH-001', patient: 'M. Ndlovu', mrn: 'MRN-10234', ward: 'Medical Ward', items: 6, amount: 4200, admitDate: '2026-04-03', status: 'unbilled' },
  { id: 'CH-002', patient: 'S. Khumalo', mrn: 'MRN-10456', ward: 'ICU', items: 14, amount: 28500, admitDate: '2026-04-01', status: 'unbilled' },
  { id: 'CH-003', patient: 'T. Dlamini', mrn: 'MRN-10789', ward: 'Surgical Ward', items: 9, amount: 12800, admitDate: '2026-04-04', status: 'partial' },
  { id: 'CH-004', patient: 'L. Phiri', mrn: 'MRN-11002', ward: 'Emergency', items: 3, amount: 1850, admitDate: '2026-04-06', status: 'unbilled' },
];

const INVOICES = [
  { id: 'INV-202604-000340', patient: 'J. Banda', amount: 5600, paidAmount: 5600, status: 'paid', date: '2026-04-05', payer: 'GEMS' },
  { id: 'INV-202604-000341', patient: 'R. Zuma', amount: 8900, paidAmount: 4450, status: 'partial', date: '2026-04-05', payer: 'Discovery' },
  { id: 'INV-202604-000342', patient: 'A. Moyo', amount: 4200, paidAmount: 0, status: 'sent', date: '2026-04-06', payer: 'Self-pay' },
  { id: 'INV-202604-000343', patient: 'P. Sithole', amount: 12400, paidAmount: 0, status: 'draft', date: '2026-04-06', payer: 'Bonitas' },
  { id: 'INV-202604-000344', patient: 'C. Ngwenya', amount: 3200, paidAmount: 0, status: 'overdue', date: '2026-03-20', payer: 'Self-pay' },
];

const CLAIMS = [
  { id: 'CLM-20260405-0001', patient: 'J. Banda', scheme: 'GEMS', amount: 5600, status: 'paid', submittedAt: '2026-04-05' },
  { id: 'CLM-20260405-0002', patient: 'R. Zuma', scheme: 'Discovery', amount: 8900, status: 'partially_approved', submittedAt: '2026-04-05', approvedAmount: 4450, rejectReason: 'Pre-auth required for MRI' },
  { id: 'CLM-20260406-0003', patient: 'P. Sithole', scheme: 'Bonitas', amount: 12400, status: 'submitted', submittedAt: '2026-04-06' },
  { id: 'CLM-20260404-0004', patient: 'K. Mthembu', scheme: 'Medihelp', amount: 6700, status: 'rejected', submittedAt: '2026-04-04', rejectReason: 'Member not active' },
];

const RECENT_PAYMENTS = [
  { id: 'TXN-20260406-0001', patient: 'A. Moyo', amount: 2100, method: 'Card', time: '10:30', reference: 'REF-445566' },
  { id: 'TXN-20260406-0002', patient: 'M. Ndlovu', amount: 500, method: 'Cash', time: '11:15', reference: 'RCT-000234' },
  { id: 'TXN-20260405-0003', patient: 'J. Banda', amount: 5600, method: 'EFT', time: '14:00', reference: 'GEMS-REF-9988' },
];

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    unbilled: { label: 'Unbilled', variant: 'outline' },
    partial: { label: 'Partial', variant: 'secondary' },
    paid: { label: 'Paid', variant: 'default' },
    sent: { label: 'Sent', variant: 'secondary' },
    draft: { label: 'Draft', variant: 'outline' },
    overdue: { label: 'Overdue', variant: 'destructive' },
    submitted: { label: 'Submitted', variant: 'secondary' },
    partially_approved: { label: 'Part Approved', variant: 'secondary' },
    rejected: { label: 'Rejected', variant: 'destructive' },
  };
  const cfg = map[status] || { label: status, variant: 'outline' as const };
  return <Badge variant={cfg.variant} className="text-xs">{cfg.label}</Badge>;
}

export function BillingPanel() {
  const [activeTab, setActiveTab] = useState<BillingTab>('overview');

  const totalUnbilled = UNBILLED_CHARGES.reduce((s, c) => s + c.amount, 0);
  const totalOutstanding = INVOICES.filter(i => ['sent', 'overdue', 'partial'].includes(i.status)).reduce((s, i) => s + i.amount - i.paidAmount, 0);
  const todayCollected = RECENT_PAYMENTS.reduce((s, p) => s + p.amount, 0);
  const claimsPending = CLAIMS.filter(c => c.status === 'submitted').length;

  return (
    <div className="space-y-3">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-3 pb-2 px-3">
          <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-amber-500" /><span className="text-xs text-muted-foreground">Unbilled Charges</span></div>
          <p className="text-lg font-bold">R{(totalUnbilled / 1000).toFixed(1)}k</p>
          <p className="text-[10px] text-muted-foreground">{UNBILLED_CHARGES.length} accounts</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-2 px-3">
          <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-red-500" /><span className="text-xs text-muted-foreground">Outstanding</span></div>
          <p className="text-lg font-bold">R{(totalOutstanding / 1000).toFixed(1)}k</p>
          <p className="text-[10px] text-muted-foreground">{INVOICES.filter(i => i.status === 'overdue').length} overdue</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-2 px-3">
          <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-green-500" /><span className="text-xs text-muted-foreground">Collected Today</span></div>
          <p className="text-lg font-bold">R{(todayCollected / 1000).toFixed(1)}k</p>
          <p className="text-[10px] text-muted-foreground">{RECENT_PAYMENTS.length} transactions</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-2 px-3">
          <div className="flex items-center gap-2"><Send className="h-4 w-4 text-blue-500" /><span className="text-xs text-muted-foreground">Claims Pending</span></div>
          <p className="text-lg font-bold">{claimsPending}</p>
          <p className="text-[10px] text-muted-foreground">{CLAIMS.filter(c => c.status === 'rejected').length} rejected</p>
        </CardContent></Card>
      </div>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as BillingTab)}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5 text-xs"><BarChart3 className="h-3.5 w-3.5" />Overview</TabsTrigger>
          <TabsTrigger value="charges" className="gap-1.5 text-xs"><Receipt className="h-3.5 w-3.5" />Charges {UNBILLED_CHARGES.length > 0 && <Badge variant="secondary" className="text-[10px] h-4 px-1 ml-1">{UNBILLED_CHARGES.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="invoices" className="gap-1.5 text-xs"><FileText className="h-3.5 w-3.5" />Invoices</TabsTrigger>
          <TabsTrigger value="claims" className="gap-1.5 text-xs"><Send className="h-3.5 w-3.5" />Claims</TabsTrigger>
          <TabsTrigger value="payments" className="gap-1.5 text-xs"><CreditCard className="h-3.5 w-3.5" />Payments</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Revenue This Week</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => {
                    const val = [32, 45, 28, 52, 41, 18][i];
                    return (
                      <div key={day} className="flex items-center gap-3">
                        <span className="text-xs w-8 text-muted-foreground">{day}</span>
                        <Progress value={val} className="flex-1 h-2" />
                        <span className="text-xs font-medium w-12 text-right">R{val}k</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Payer Mix</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Medical Aid', pct: 62, color: '[&>div]:bg-blue-500' },
                    { name: 'Self-Pay', pct: 22, color: '[&>div]:bg-amber-500' },
                    { name: 'Government', pct: 12, color: '[&>div]:bg-green-500' },
                    { name: 'Corporate', pct: 4, color: '[&>div]:bg-purple-500' },
                  ].map(p => (
                    <div key={p.name} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{p.name}</span><span className="text-muted-foreground">{p.pct}%</span>
                      </div>
                      <Progress value={p.pct} className={`h-1.5 ${p.color}`} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Charges */}
        <TabsContent value="charges" className="mt-3">
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {UNBILLED_CHARGES.map(ch => (
                <Card key={ch.id} className="border-l-4 border-l-amber-400">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{ch.patient} <span className="text-xs text-muted-foreground">({ch.mrn})</span></p>
                        <p className="text-xs text-muted-foreground">{ch.ward} • {ch.items} charge items • Admitted {ch.admitDate}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-bold">R{ch.amount.toLocaleString()}</p>
                        {getStatusBadge(ch.status)}
                        <Button size="sm" className="h-7 text-xs" onClick={() => toast.success(`Invoice generated for ${ch.patient}`)}>Bill</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Invoices */}
        <TabsContent value="invoices" className="mt-3">
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {INVOICES.map(inv => (
                <Card key={inv.id} className={inv.status === 'overdue' ? 'border-l-4 border-l-red-500' : ''}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{inv.id}</p>
                          {getStatusBadge(inv.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">{inv.patient} • {inv.payer} • {inv.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">R{inv.amount.toLocaleString()}</p>
                        {inv.paidAmount > 0 && inv.paidAmount < inv.amount && (
                          <p className="text-[10px] text-green-600">R{inv.paidAmount.toLocaleString()} paid</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Claims */}
        <TabsContent value="claims" className="mt-3">
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {CLAIMS.map(cl => (
                <Card key={cl.id} className={cl.status === 'rejected' ? 'border-l-4 border-l-red-500' : ''}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{cl.id}</p>
                          {getStatusBadge(cl.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">{cl.patient} • {cl.scheme} • {cl.submittedAt}</p>
                        {cl.rejectReason && <p className="text-xs text-red-500 mt-0.5">{cl.rejectReason}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">R{cl.amount.toLocaleString()}</p>
                        {cl.approvedAmount && <p className="text-[10px] text-green-600">R{cl.approvedAmount.toLocaleString()} approved</p>}
                        {cl.status === 'rejected' && (
                          <Button size="sm" variant="outline" className="h-6 text-[10px] mt-1" onClick={() => toast.info('Re-submitting claim...')}>Resubmit</Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Payments */}
        <TabsContent value="payments" className="mt-3">
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {RECENT_PAYMENTS.map(pmt => (
                <div key={pmt.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{pmt.patient}</p>
                      <p className="text-xs text-muted-foreground">{pmt.method} • {pmt.reference} • {pmt.time}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-green-600">+R{pmt.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
