import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { usePaymentData } from "@/hooks/usePaymentData";
import { 
  CreditCard,
  Smartphone,
  Banknote,
  Building2,
  Download,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  Receipt,
  FileText,
  RefreshCw,
  ArrowDownLeft,
  DollarSign,
  Shield
} from "lucide-react";
import { format } from "date-fns";

const PAYMENT_METHODS = [
  { id: "cash", name: "Cash", icon: Banknote, color: "bg-success" },
  { id: "card", name: "Card Payment", icon: CreditCard, color: "bg-primary" },
  { id: "mobile_money", name: "Mobile Money", icon: Smartphone, color: "bg-warning" },
  { id: "bank_transfer", name: "Bank Transfer", icon: Building2, color: "bg-secondary" }
];

const MOBILE_PROVIDERS = ["EcoCash", "OneMoney", "InnBucks", "Telecash"];

export function PaymentGateway() {
  const { transactions, claims, stats, loading, createTransaction, refetch } = usePaymentData();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMethod, setFilterMethod] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    patientId: "",
    amount: "",
    description: "",
    method: "",
    provider: ""
  });

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.transaction_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = filterMethod === "all" || t.payment_method === filterMethod;
    const matchesStatus = filterStatus === "all" || t.status === filterStatus;
    return matchesSearch && matchesMethod && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "approved":
      case "paid":
        return "bg-success text-success-foreground";
      case "processing":
      case "submitted":
        return "bg-primary text-primary-foreground";
      case "pending":
      case "partially_approved":
        return "bg-warning text-warning-foreground";
      case "failed":
      case "rejected":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "cash": return Banknote;
      case "card": return CreditCard;
      case "mobile_money": return Smartphone;
      case "bank_transfer": return Building2;
      case "insurance": return Shield;
      default: return DollarSign;
    }
  };

  const handlePayment = async () => {
    if (!paymentForm.patientId || !paymentForm.amount || !paymentForm.method) {
      return;
    }

    await createTransaction({
      patient_id: paymentForm.patientId,
      amount: parseFloat(paymentForm.amount),
      payment_method: paymentForm.method,
      transaction_type: "payment",
      notes: paymentForm.description || null,
      status: paymentForm.method === "cash" ? "completed" : "pending"
    });

    setIsPaymentOpen(false);
    setPaymentForm({
      patientId: "",
      amount: "",
      description: "",
      method: "",
      provider: ""
    });
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Collections</p>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold text-success">${stats.todayTotal.toFixed(2)}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <ArrowDownLeft className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Payments</p>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold text-warning">${stats.pendingTotal.toFixed(2)}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Claims</p>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{stats.pendingClaims}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transactions Today</p>
                {loading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats.transactionCount}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                <Receipt className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="transactions" className="flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="claims">Insurance Claims</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Process Payment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Payment Method Selection */}
                  <div>
                    <Label className="mb-3 block">Payment Method</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {PAYMENT_METHODS.map(method => (
                        <Button
                          key={method.id}
                          variant={paymentForm.method === method.id ? "default" : "outline"}
                          className="justify-start h-auto py-3"
                          onClick={() => setPaymentForm(prev => ({ ...prev, method: method.id, provider: "" }))}
                        >
                          <method.icon className="h-5 w-5 mr-2" />
                          {method.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {paymentForm.method === "mobile_money" && (
                    <div className="space-y-2">
                      <Label>Mobile Money Provider</Label>
                      <Select 
                        value={paymentForm.provider}
                        onValueChange={(v) => setPaymentForm(prev => ({ ...prev, provider: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {MOBILE_PROVIDERS.map(p => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <Label>Patient ID *</Label>
                    <Input
                      value={paymentForm.patientId}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, patientId: e.target.value }))}
                      placeholder="Enter patient ID"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Amount (USD) *</Label>
                    <Input
                      type="number"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={paymentForm.description}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="e.g., Consultation Fee, Lab Tests"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>Cancel</Button>
                  <Button onClick={handlePayment} disabled={!paymentForm.method || !paymentForm.amount || !paymentForm.patientId}>
                    Process Payment
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="flex-1 overflow-hidden mt-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterMethod} onValueChange={setFilterMethod}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  {loading ? (
                    [1, 2, 3].map((i) => (
                      <Card key={i} className="p-4">
                        <Skeleton className="h-16 w-full" />
                      </Card>
                    ))
                  ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No transactions found</p>
                    </div>
                  ) : (
                    filteredTransactions.map((transaction) => {
                      const MethodIcon = getMethodIcon(transaction.payment_method);
                      return (
                        <Card key={transaction.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                <MethodIcon className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-medium">{transaction.transaction_number}</p>
                                <p className="text-sm text-muted-foreground">
                                  {transaction.transaction_type} • {transaction.notes || "No description"}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">
                                {transaction.currency} {transaction.amount.toFixed(2)}
                              </p>
                              <Badge className={getStatusColor(transaction.status)}>
                                {transaction.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(transaction.created_at), "dd MMM HH:mm")}
                            </div>
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Claims Tab */}
        <TabsContent value="claims" className="flex-1 overflow-hidden mt-4">
          <Card className="h-full">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <Card key={i} className="p-4">
                      <Skeleton className="h-20 w-full" />
                    </Card>
                  ))
                ) : claims.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No insurance claims found</p>
                  </div>
                ) : (
                  claims.map((claim) => (
                    <Card key={claim.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{claim.claim_number}</h4>
                            <Badge className={getStatusColor(claim.status)}>
                              {claim.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {claim.insurance_provider} • Policy: {claim.policy_number || "N/A"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            ${claim.total_amount.toFixed(2)}
                          </p>
                          {claim.approved_amount && (
                            <p className="text-sm text-success">
                              Approved: ${claim.approved_amount.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
