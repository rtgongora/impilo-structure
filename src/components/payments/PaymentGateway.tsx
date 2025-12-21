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
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard,
  Smartphone,
  Banknote,
  Building2,
  Send,
  Download,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Receipt,
  FileText,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  DollarSign,
  Shield,
  Users
} from "lucide-react";
import { toast } from "sonner";

interface Transaction {
  id: string;
  type: "payment" | "refund" | "remittance" | "claim";
  method: "cash" | "card" | "mobile_money" | "bank_transfer" | "insurance";
  amount: number;
  currency: string;
  status: "completed" | "pending" | "failed" | "processing";
  reference: string;
  patientName?: string;
  patientMrn?: string;
  description: string;
  createdAt: string;
  provider?: string;
}

interface InsuranceClaim {
  id: string;
  claimNumber: string;
  patientName: string;
  patientMrn: string;
  insurer: string;
  policyNumber: string;
  totalAmount: number;
  approvedAmount?: number;
  status: "submitted" | "processing" | "approved" | "partially_approved" | "rejected" | "paid";
  submittedAt: string;
  items: { description: string; amount: number; approved?: boolean }[];
}

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    type: "payment",
    method: "cash",
    amount: 50.00,
    currency: "USD",
    status: "completed",
    reference: "TXN-2024-0001",
    patientName: "John Doe",
    patientMrn: "MRN-2024-000001",
    description: "Consultation Fee",
    createdAt: "2024-01-15T10:30:00",
    provider: "Front Desk"
  },
  {
    id: "2",
    type: "payment",
    method: "mobile_money",
    amount: 120.00,
    currency: "USD",
    status: "completed",
    reference: "TXN-2024-0002",
    patientName: "Jane Smith",
    patientMrn: "MRN-2024-000002",
    description: "Lab Tests",
    createdAt: "2024-01-15T11:15:00",
    provider: "EcoCash"
  },
  {
    id: "3",
    type: "payment",
    method: "card",
    amount: 500.00,
    currency: "USD",
    status: "processing",
    reference: "TXN-2024-0003",
    patientName: "Robert Brown",
    patientMrn: "MRN-2024-000003",
    description: "Surgery Deposit",
    createdAt: "2024-01-15T14:00:00",
    provider: "VISA"
  },
  {
    id: "4",
    type: "remittance",
    method: "bank_transfer",
    amount: 1500.00,
    currency: "USD",
    status: "pending",
    reference: "REM-2024-0001",
    description: "Diaspora Remittance - Family Medical",
    createdAt: "2024-01-15T09:00:00",
    provider: "CBZ Bank"
  },
  {
    id: "5",
    type: "claim",
    method: "insurance",
    amount: 850.00,
    currency: "USD",
    status: "completed",
    reference: "CLM-2024-0001",
    patientName: "Mary Johnson",
    patientMrn: "MRN-2024-000004",
    description: "PSMAS Claim Payment",
    createdAt: "2024-01-14T16:30:00",
    provider: "PSMAS"
  }
];

const MOCK_CLAIMS: InsuranceClaim[] = [
  {
    id: "1",
    claimNumber: "CLM-2024-0001",
    patientName: "John Doe",
    patientMrn: "MRN-2024-000001",
    insurer: "PSMAS",
    policyNumber: "PSM-2024-123456",
    totalAmount: 450.00,
    approvedAmount: 400.00,
    status: "approved",
    submittedAt: "2024-01-10",
    items: [
      { description: "Consultation", amount: 50.00, approved: true },
      { description: "Blood Tests", amount: 150.00, approved: true },
      { description: "X-Ray", amount: 200.00, approved: true },
      { description: "Medication", amount: 50.00, approved: false }
    ]
  },
  {
    id: "2",
    claimNumber: "CLM-2024-0002",
    patientName: "Jane Smith",
    patientMrn: "MRN-2024-000002",
    insurer: "CIMAS",
    policyNumber: "CIM-2024-789012",
    totalAmount: 2500.00,
    status: "processing",
    submittedAt: "2024-01-12",
    items: [
      { description: "Hospital Admission", amount: 1000.00 },
      { description: "Surgery", amount: 1200.00 },
      { description: "Post-Op Medication", amount: 300.00 }
    ]
  },
  {
    id: "3",
    claimNumber: "CLM-2024-0003",
    patientName: "Robert Brown",
    patientMrn: "MRN-2024-000003",
    insurer: "First Mutual",
    policyNumber: "FM-2024-345678",
    totalAmount: 180.00,
    status: "submitted",
    submittedAt: "2024-01-15",
    items: [
      { description: "Specialist Consultation", amount: 80.00 },
      { description: "ECG", amount: 100.00 }
    ]
  }
];

const PAYMENT_METHODS = [
  { id: "cash", name: "Cash", icon: Banknote, color: "bg-success" },
  { id: "card", name: "Card Payment", icon: CreditCard, color: "bg-primary" },
  { id: "mobile_money", name: "Mobile Money", icon: Smartphone, color: "bg-warning" },
  { id: "bank_transfer", name: "Bank Transfer", icon: Building2, color: "bg-secondary" }
];

const MOBILE_PROVIDERS = ["EcoCash", "OneMoney", "InnBucks", "Telecash"];
const INSURERS = ["PSMAS", "CIMAS", "First Mutual", "Alliance Health", "Fidelity Life"];

export function PaymentGateway() {
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [claims, setClaims] = useState<InsuranceClaim[]>(MOCK_CLAIMS);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMethod, setFilterMethod] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isClaimOpen, setIsClaimOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>("");

  const [paymentForm, setPaymentForm] = useState({
    patientName: "",
    patientMrn: "",
    amount: "",
    description: "",
    method: "",
    provider: ""
  });

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = filterMethod === "all" || t.method === filterMethod;
    const matchesStatus = filterStatus === "all" || t.status === filterStatus;
    return matchesSearch && matchesMethod && matchesStatus;
  });

  const todayTotal = transactions
    .filter(t => t.status === "completed" && t.type === "payment")
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingTotal = transactions
    .filter(t => t.status === "pending" || t.status === "processing")
    .reduce((sum, t) => sum + t.amount, 0);

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

  const handlePayment = () => {
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: "payment",
      method: paymentForm.method as any,
      amount: parseFloat(paymentForm.amount),
      currency: "USD",
      status: paymentForm.method === "cash" ? "completed" : "processing",
      reference: `TXN-2024-${String(transactions.length + 1).padStart(4, '0')}`,
      patientName: paymentForm.patientName,
      patientMrn: paymentForm.patientMrn,
      description: paymentForm.description,
      createdAt: new Date().toISOString(),
      provider: paymentForm.provider
    };

    setTransactions(prev => [transaction, ...prev]);
    setIsPaymentOpen(false);
    toast.success(`Payment ${paymentForm.method === "cash" ? "completed" : "initiated"} successfully`);
    
    setPaymentForm({
      patientName: "",
      patientMrn: "",
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
                <p className="text-2xl font-bold text-success">${todayTotal.toFixed(2)}</p>
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
                <p className="text-2xl font-bold text-warning">${pendingTotal.toFixed(2)}</p>
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
                <p className="text-2xl font-bold">{claims.filter(c => c.status !== "paid").length}</p>
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
                <p className="text-2xl font-bold">{transactions.length}</p>
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
            <TabsTrigger value="remittances">Remittances</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Patient Name</Label>
                      <Input
                        value={paymentForm.patientName}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, patientName: e.target.value }))}
                        placeholder="Enter patient name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Patient MRN</Label>
                      <Input
                        value={paymentForm.patientMrn}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, patientMrn: e.target.value }))}
                        placeholder="Enter MRN"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Amount (USD)</Label>
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
                  <Button onClick={handlePayment} disabled={!paymentForm.method || !paymentForm.amount}>
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
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full">
                <table className="w-full">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Reference</th>
                      <th className="text-left p-3 font-medium">Patient</th>
                      <th className="text-left p-3 font-medium">Description</th>
                      <th className="text-left p-3 font-medium">Method</th>
                      <th className="text-left p-3 font-medium">Amount</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Date</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map(txn => {
                      const MethodIcon = getMethodIcon(txn.method);
                      return (
                        <tr key={txn.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-mono text-sm">{txn.reference}</td>
                          <td className="p-3">
                            {txn.patientName ? (
                              <div>
                                <p className="font-medium">{txn.patientName}</p>
                                <p className="text-xs text-muted-foreground">{txn.patientMrn}</p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-3">{txn.description}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <MethodIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="capitalize">{txn.method.replace("_", " ")}</span>
                              {txn.provider && (
                                <Badge variant="outline" className="text-xs">{txn.provider}</Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-3 font-medium">
                            {txn.type === "refund" ? "-" : ""}${txn.amount.toFixed(2)}
                          </td>
                          <td className="p-3">
                            <Badge className={getStatusColor(txn.status)} variant="secondary">
                              {txn.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {new Date(txn.createdAt).toLocaleString()}
                          </td>
                          <td className="p-3">
                            <Button size="sm" variant="ghost">
                              <Receipt className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insurance Claims Tab */}
        <TabsContent value="claims" className="flex-1 overflow-hidden mt-4">
          <div className="flex gap-4 mb-4">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Claim
            </Button>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Claim Status
            </Button>
          </div>
          <div className="space-y-4">
            {claims.map(claim => (
              <Card key={claim.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">{claim.claimNumber}</h4>
                        <Badge className={getStatusColor(claim.status)}>{claim.status}</Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Patient:</span>
                          <p className="font-medium">{claim.patientName}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Insurer:</span>
                          <p className="font-medium">{claim.insurer}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Policy:</span>
                          <p className="font-medium">{claim.policyNumber}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Submitted:</span>
                          <p className="font-medium">{claim.submittedAt}</p>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-2">Claim Items</p>
                        <div className="space-y-1">
                          {claim.items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2">
                                {item.approved !== undefined && (
                                  item.approved ? 
                                    <CheckCircle2 className="h-3 w-3 text-success" /> : 
                                    <XCircle className="h-3 w-3 text-destructive" />
                                )}
                                {item.description}
                              </span>
                              <span className={item.approved === false ? "line-through text-muted-foreground" : ""}>
                                ${item.amount.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm text-muted-foreground">Total Claimed</p>
                      <p className="text-xl font-bold">${claim.totalAmount.toFixed(2)}</p>
                      {claim.approvedAmount && (
                        <>
                          <p className="text-sm text-muted-foreground mt-2">Approved</p>
                          <p className="text-lg font-bold text-success">${claim.approvedAmount.toFixed(2)}</p>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Remittances Tab */}
        <TabsContent value="remittances" className="flex-1 overflow-hidden mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Send className="h-5 w-5" />
                Diaspora Remittances (MusheX Gateway)
              </CardTitle>
              <CardDescription>
                Receive health payments from family abroad via CBZ Bank integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total Received (This Month)</p>
                    <p className="text-2xl font-bold">$4,250.00</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Pending Receipts</p>
                    <p className="text-2xl font-bold text-warning">$1,500.00</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Active Beneficiaries</p>
                    <p className="text-2xl font-bold">12</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                {transactions.filter(t => t.type === "remittance").map(rem => (
                  <div key={rem.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <ArrowDownLeft className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{rem.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {rem.provider} • {new Date(rem.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={getStatusColor(rem.status)}>{rem.status}</Badge>
                      <span className="text-lg font-bold">${rem.amount.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
