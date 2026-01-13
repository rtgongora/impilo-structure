import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Wallet,
  CreditCard,
  Smartphone,
  Building2,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Send,
  Receipt,
  Gift,
  Users,
  Heart,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Banknote
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Transaction {
  id: string;
  type: "credit" | "debit";
  category: "deposit" | "payment" | "refund" | "transfer" | "voucher" | "donation";
  description: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "failed";
  reference?: string;
}

interface Voucher {
  id: string;
  code: string;
  type: "corporate" | "government" | "donor";
  sponsor: string;
  amount: number;
  usedAmount: number;
  expiresAt: string;
  restrictions?: string;
}

interface Campaign {
  id: string;
  title: string;
  goal: number;
  raised: number;
  donors: number;
  daysLeft: number;
  status: "active" | "completed" | "paused";
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: "1", type: "credit", category: "deposit", description: "EcoCash Deposit", amount: 500, date: "2024-01-18", status: "completed", reference: "ECO-123456" },
  { id: "2", type: "debit", category: "payment", description: "Cardiology Consultation - Dr. Johnson", amount: 50, date: "2024-01-18", status: "completed", reference: "INV-2024-0123" },
  { id: "3", type: "credit", category: "refund", description: "Cancelled Lab Test Refund", amount: 25, date: "2024-01-15", status: "completed" },
  { id: "4", type: "debit", category: "payment", description: "Pharmacy - Medications", amount: 85, date: "2024-01-14", status: "completed", reference: "RX-2024-0089" },
  { id: "5", type: "credit", category: "voucher", description: "PSMAS Insurance Credit", amount: 200, date: "2024-01-10", status: "completed" },
  { id: "6", type: "debit", category: "transfer", description: "Transfer to Mary Doe (Dependent)", amount: 100, date: "2024-01-08", status: "completed" },
];

const MOCK_VOUCHERS: Voucher[] = [
  {
    id: "1",
    code: "PSMAS-2024",
    type: "corporate",
    sponsor: "PSMAS Medical Aid",
    amount: 500,
    usedAmount: 200,
    expiresAt: "2024-12-31",
    restrictions: "Consultations and diagnostics only"
  },
  {
    id: "2",
    code: "GOV-NCD-001",
    type: "government",
    sponsor: "Ministry of Health",
    amount: 100,
    usedAmount: 0,
    expiresAt: "2024-06-30",
    restrictions: "NCD medications only"
  }
];

const MOCK_CAMPAIGN: Campaign = {
  id: "1",
  title: "Heart Surgery Fund",
  goal: 5000,
  raised: 3250,
  donors: 48,
  daysLeft: 15,
  status: "active"
};

const PAYMENT_METHODS = [
  { id: "ecocash", name: "EcoCash", icon: Smartphone },
  { id: "onemoney", name: "OneMoney", icon: Smartphone },
  { id: "innbucks", name: "InnBucks", icon: Smartphone },
  { id: "card", name: "Debit/Credit Card", icon: CreditCard },
  { id: "bank", name: "Bank Transfer", icon: Building2 },
];

export function PortalWallet() {
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  const balance = 1250.00;
  const pendingBalance = 50.00;

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-4xl font-bold">${balance.toFixed(2)}</p>
              {pendingBalance > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  + ${pendingBalance.toFixed(2)} pending
                </p>
              )}
            </div>
            <div className="p-3 rounded-full bg-primary/10">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Dialog open={addFundsOpen} onOpenChange={setAddFundsOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Funds
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Funds to Wallet</DialogTitle>
                  <DialogDescription>
                    Choose a payment method and amount
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium">Amount (USD)</label>
                    <Input 
                      type="number" 
                      placeholder="Enter amount" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Payment Method</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {PAYMENT_METHODS.map(method => (
                        <div
                          key={method.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedMethod === method.id ? "border-primary bg-primary/5" : ""
                          }`}
                          onClick={() => setSelectedMethod(method.id)}
                        >
                          <div className="flex items-center gap-2">
                            <method.icon className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{method.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full" disabled={!amount || !selectedMethod}>
                    Continue to Pay
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="flex-1">
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
            <Button variant="outline" className="flex-1">
              <Receipt className="h-4 w-4 mr-2" />
              Pay Bill
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="vouchers">Vouchers & Credits</TabsTrigger>
          <TabsTrigger value="family">Family Wallet</TabsTrigger>
          <TabsTrigger value="crowdfund">Crowdfunding</TabsTrigger>
        </TabsList>

        {/* Transactions */}
        <TabsContent value="transactions" className="space-y-4">
          <div className="flex gap-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="credit">Credits Only</SelectItem>
                <SelectItem value="debit">Debits Only</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {MOCK_TRANSACTIONS.map(tx => (
                <Card key={tx.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          tx.type === "credit" ? "bg-success/10" : "bg-muted"
                        }`}>
                          {tx.type === "credit" ? (
                            <ArrowDownLeft className="h-4 w-4 text-success" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{tx.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{tx.date}</span>
                            {tx.reference && <span>• {tx.reference}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          tx.type === "credit" ? "text-success" : ""
                        }`}>
                          {tx.type === "credit" ? "+" : "-"}${tx.amount.toFixed(2)}
                        </p>
                        <Badge variant={tx.status === "completed" ? "outline" : "secondary"} className="text-xs">
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Vouchers */}
        <TabsContent value="vouchers" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Your available vouchers and credits</p>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Redeem Code
            </Button>
          </div>
          <div className="space-y-3">
            {MOCK_VOUCHERS.map(voucher => (
              <Card key={voucher.id} className="overflow-hidden">
                <div className={`h-1 ${
                  voucher.type === "corporate" ? "bg-primary" :
                  voucher.type === "government" ? "bg-success" : "bg-warning"
                }`} />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-muted-foreground" />
                        <p className="font-semibold">{voucher.sponsor}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Code: {voucher.code}
                      </p>
                      {voucher.restrictions && (
                        <p className="text-xs text-warning mt-1">
                          <AlertCircle className="h-3 w-3 inline mr-1" />
                          {voucher.restrictions}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        ${(voucher.amount - voucher.usedAmount).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        of ${voucher.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Progress value={(voucher.usedAmount / voucher.amount) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Expires: {voucher.expiresAt}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Family Wallet */}
        <TabsContent value="family" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Family Members
              </CardTitle>
              <CardDescription>
                Send funds to dependents or caregivers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold">MD</span>
                  </div>
                  <div>
                    <p className="font-medium">Mary Doe</p>
                    <p className="text-xs text-muted-foreground">Spouse • Full access</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">$150.00</Badge>
                  <Button size="sm" variant="outline">Send</Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                    <span className="text-sm font-bold">JD</span>
                  </div>
                  <div>
                    <p className="font-medium">James Doe Jr.</p>
                    <p className="text-xs text-muted-foreground">Child • Limited ($50/month)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">$30.00</Badge>
                  <Button size="sm" variant="outline">Send</Button>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Family Member
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pay for Someone</CardTitle>
              <CardDescription>
                Send health credits to anyone using their Impilo ID
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Enter Impilo ID or phone number" />
              <Input placeholder="Amount (USD)" type="number" />
              <Button className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Send Health Credits
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Crowdfunding */}
        <TabsContent value="crowdfund" className="space-y-4">
          {MOCK_CAMPAIGN.status === "active" ? (
            <Card className="border-primary/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Heart className="h-5 w-5 text-destructive" />
                      {MOCK_CAMPAIGN.title}
                    </CardTitle>
                    <CardDescription>Your active fundraising campaign</CardDescription>
                  </div>
                  <Badge className="bg-success">Active</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-bold text-2xl">${MOCK_CAMPAIGN.raised.toFixed(2)}</span>
                    <span className="text-muted-foreground">of ${MOCK_CAMPAIGN.goal.toFixed(2)}</span>
                  </div>
                  <Progress value={(MOCK_CAMPAIGN.raised / MOCK_CAMPAIGN.goal) * 100} className="h-3" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span><Users className="h-4 w-4 inline mr-1" />{MOCK_CAMPAIGN.donors} donors</span>
                    <span><Clock className="h-4 w-4 inline mr-1" />{MOCK_CAMPAIGN.daysLeft} days left</span>
                  </div>
                  <Button size="sm" variant="outline">
                    <QrCode className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline">View Donors</Button>
                  <Button variant="outline">Post Update</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium">No Active Campaign</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a fundraising campaign for medical expenses
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Start Campaign
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <p className="font-medium">Create Your Campaign</p>
                  <p className="text-muted-foreground">Set a goal and tell your story</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">2</div>
                <div>
                  <p className="font-medium">Share with Network</p>
                  <p className="text-muted-foreground">Friends and family can contribute</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <p className="font-medium">Funds Go Directly to Care</p>
                  <p className="text-muted-foreground">Payments made directly to providers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
