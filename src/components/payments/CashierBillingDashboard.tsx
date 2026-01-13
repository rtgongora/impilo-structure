import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useChargeSheets, useInvoices, useVisitAccounts } from "@/hooks/useBillingData";
import { usePaymentRequests, useReceipts } from "@/hooks/usePaymentOrchestrator";
import { 
  Receipt,
  DollarSign,
  FileText,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Smartphone,
  Banknote,
  Building2,
  Printer,
  Eye,
  Send,
  Calculator
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export function CashierBillingDashboard() {
  const { chargeSheets, loading: chargesLoading } = useChargeSheets();
  const { invoices, loading: invoicesLoading, createInvoice } = useInvoices();
  const { accounts, loading: accountsLoading } = useVisitAccounts();
  const { requests: paymentRequests, loading: paymentsLoading, createPaymentRequest, stats: paymentStats } = usePaymentRequests();
  const { receipts } = useReceipts();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCharges, setSelectedCharges] = useState<string[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");

  const loading = chargesLoading || invoicesLoading || accountsLoading || paymentsLoading;

  // Stats calculations
  const pendingCharges = chargeSheets.filter(c => c.status === "pending");
  const unbilledTotal = pendingCharges.reduce((sum, c) => sum + c.net_amount, 0);
  const todayInvoices = invoices.filter(i => {
    const today = new Date().toDateString();
    return new Date(i.created_at || "").toDateString() === today;
  });
  const todayTotal = todayInvoices.reduce((sum, i) => sum + i.total_amount, 0);
  const pendingPayments = paymentRequests.filter(p => p.status === "pending" || p.status === "initiated");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
      case "completed":
        return <Badge className="bg-success text-success-foreground"><CheckCircle2 className="h-3 w-3 mr-1" />{status}</Badge>;
      case "pending":
      case "initiated":
        return <Badge className="bg-warning text-warning-foreground"><Clock className="h-3 w-3 mr-1" />{status}</Badge>;
      case "overdue":
      case "failed":
        return <Badge className="bg-destructive text-destructive-foreground"><AlertCircle className="h-3 w-3 mr-1" />{status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleGenerateInvoice = async () => {
    if (selectedCharges.length === 0) {
      toast.error("Select charges to invoice");
      return;
    }

    const selected = chargeSheets.filter(c => selectedCharges.includes(c.id));
    if (selected.length === 0) return;

    const firstCharge = selected[0];
    const totalAmount = selected.reduce((sum, c) => sum + c.net_amount, 0);

    try {
      await createInvoice({
        visit_id: firstCharge.visit_id,
        patient_id: firstCharge.patient_id,
        total_amount: totalAmount,
      });
      toast.success("Invoice created successfully");
      setSelectedCharges([]);
    } catch (err) {
      toast.error("Failed to create invoice");
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedInvoice || !paymentMethod || !paymentAmount) {
      toast.error("Complete all payment fields");
      return;
    }

    const invoice = invoices.find(i => i.id === selectedInvoice);
    if (!invoice) return;

    try {
      await createPaymentRequest({
        invoice_id: selectedInvoice,
        visit_id: invoice.visit_id || undefined,
        patient_id: invoice.patient_id,
        amount: parseFloat(paymentAmount),
        purpose: `Payment for invoice ${invoice.invoice_number}`,
        preferred_channel: paymentMethod,
      });
      toast.success("Payment request created");
      setShowPaymentDialog(false);
      setSelectedInvoice(null);
      setPaymentMethod("");
      setPaymentAmount("");
    } catch (err) {
      toast.error("Failed to create payment request");
    }
  };

  const filteredCharges = chargeSheets.filter(c => {
    const search = searchTerm.toLowerCase();
    return c.service_name.toLowerCase().includes(search) ||
           c.service_code.toLowerCase().includes(search);
  });

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unbilled Charges</p>
                <p className="text-2xl font-bold">${unbilledTotal.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Invoices</p>
                <p className="text-2xl font-bold">{todayInvoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Revenue</p>
                <p className="text-2xl font-bold">${todayTotal.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Payments</p>
                <p className="text-2xl font-bold">{pendingPayments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Workflow Tabs */}
      <Tabs defaultValue="charges" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="charges">Charge Sheets</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
        </TabsList>

        {/* Charge Sheets Tab */}
        <TabsContent value="charges">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Pending Charge Sheets</CardTitle>
                  <CardDescription>Select charges to generate invoice</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search charges..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <Button 
                    onClick={handleGenerateInvoice}
                    disabled={selectedCharges.length === 0}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Invoice ({selectedCharges.length})
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCharges(pendingCharges.map(c => c.id));
                            } else {
                              setSelectedCharges([]);
                            }
                          }}
                          checked={selectedCharges.length === pendingCharges.length && pendingCharges.length > 0}
                        />
                      </TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Net Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <Clock className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : filteredCharges.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No pending charges
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCharges.map((charge) => (
                        <TableRow key={charge.id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedCharges.includes(charge.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCharges([...selectedCharges, charge.id]);
                                } else {
                                  setSelectedCharges(selectedCharges.filter(id => id !== charge.id));
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{charge.service_name}</TableCell>
                          <TableCell className="text-muted-foreground">{charge.service_code}</TableCell>
                          <TableCell>{format(new Date(charge.service_date), "dd MMM yyyy")}</TableCell>
                          <TableCell>{charge.quantity}</TableCell>
                          <TableCell className="text-right">${charge.unit_price.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">${charge.net_amount.toFixed(2)}</TableCell>
                          <TableCell>{getStatusBadge(charge.status)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
              {selectedCharges.length > 0 && (
                <div className="mt-4 p-4 bg-muted rounded-lg flex items-center justify-between">
                  <span className="font-medium">{selectedCharges.length} charges selected</span>
                  <span className="text-xl font-bold">
                    Total: ${chargeSheets
                      .filter(c => selectedCharges.includes(c.id))
                      .reduce((sum, c) => sum + c.net_amount, 0)
                      .toFixed(2)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Invoices</CardTitle>
                  <CardDescription>Manage patient invoices and collect payments</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{invoice.invoice_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(invoice.created_at || ""), "dd MMM yyyy HH:mm")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-bold">${invoice.total_amount.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">
                            Paid: ${invoice.amount_paid.toFixed(2)}
                          </p>
                        </div>
                        {getStatusBadge(invoice.status)}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Printer className="h-4 w-4" />
                          </Button>
                          {invoice.status !== "paid" && (
                            <Dialog open={showPaymentDialog && selectedInvoice === invoice.id} onOpenChange={(open) => {
                              setShowPaymentDialog(open);
                              if (open) setSelectedInvoice(invoice.id);
                            }}>
                              <DialogTrigger asChild>
                                <Button size="sm">
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  Pay
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Process Payment</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="p-4 bg-muted rounded-lg">
                                    <p className="text-sm text-muted-foreground">Invoice</p>
                                    <p className="font-bold">{invoice.invoice_number}</p>
                                    <p className="text-2xl font-bold mt-2">
                                      Balance: ${(invoice.total_amount - invoice.amount_paid).toFixed(2)}
                                    </p>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label>Payment Method</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                      {[
                                        { id: "cash", icon: Banknote, label: "Cash" },
                                        { id: "card", icon: CreditCard, label: "Card" },
                                        { id: "mobile_money", icon: Smartphone, label: "Mobile Money" },
                                        { id: "bank_transfer", icon: Building2, label: "Bank Transfer" },
                                      ].map((method) => (
                                        <Button
                                          key={method.id}
                                          variant={paymentMethod === method.id ? "default" : "outline"}
                                          className="justify-start"
                                          onClick={() => setPaymentMethod(method.id)}
                                        >
                                          <method.icon className="h-4 w-4 mr-2" />
                                          {method.label}
                                        </Button>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Amount</Label>
                                    <Input
                                      type="number"
                                      value={paymentAmount}
                                      onChange={(e) => setPaymentAmount(e.target.value)}
                                      placeholder="0.00"
                                    />
                                    <Button
                                      variant="link"
                                      className="p-0 h-auto text-sm"
                                      onClick={() => setPaymentAmount((invoice.total_amount - invoice.amount_paid).toFixed(2))}
                                    >
                                      Pay full balance
                                    </Button>
                                  </div>

                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                                      Cancel
                                    </Button>
                                    <Button 
                                      onClick={handleProcessPayment}
                                      disabled={!paymentMethod || !paymentAmount}
                                    >
                                      Process Payment
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Payment Requests</CardTitle>
                  <CardDescription>Track payment request status across all channels</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="flex gap-1">
                    <Banknote className="h-3 w-3" /> Cash: {paymentStats.cash}
                  </Badge>
                  <Badge variant="outline" className="flex gap-1">
                    <Smartphone className="h-3 w-3" /> Mobile: {paymentStats.mobile}
                  </Badge>
                  <Badge variant="outline" className="flex gap-1">
                    <CreditCard className="h-3 w-3" /> Card: {paymentStats.card}
                  </Badge>
                  <Badge variant="outline" className="flex gap-1">
                    <Building2 className="h-3 w-3" /> Bank: {paymentStats.bank}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {paymentRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          {request.preferred_channel === "cash" && <Banknote className="h-5 w-5 text-primary" />}
                          {request.preferred_channel === "mobile_money" && <Smartphone className="h-5 w-5 text-primary" />}
                          {request.preferred_channel === "card" && <CreditCard className="h-5 w-5 text-primary" />}
                          {request.preferred_channel === "bank_transfer" && <Building2 className="h-5 w-5 text-primary" />}
                          {!request.preferred_channel && <DollarSign className="h-5 w-5 text-primary" />}
                        </div>
                        <div>
                          <p className="font-medium">{request.payment_request_number}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {(request.preferred_channel || "unknown").replace("_", " ")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-bold">${request.amount.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(request.created_at || ""), "dd MMM HH:mm")}
                          </p>
                        </div>
                        {getStatusBadge(request.status)}
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Receipts Tab */}
        <TabsContent value="receipts">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Receipts</CardTitle>
              <CardDescription>View and print payment receipts</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {receipts.map((receipt) => (
                    <div
                      key={receipt.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                          <Receipt className="h-5 w-5 text-success" />
                        </div>
                        <div>
                          <p className="font-medium">{receipt.receipt_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(receipt.receipt_date), "dd MMM yyyy HH:mm")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-bold">${receipt.amount.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {receipt.payment_method.replace("_", " ")}
                          </p>
                        </div>
                        {receipt.is_voided ? (
                          <Badge variant="destructive">Voided</Badge>
                        ) : (
                          <Badge className="bg-success text-success-foreground">Paid</Badge>
                        )}
                        <Button variant="outline" size="sm">
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}