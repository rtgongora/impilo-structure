import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  CreditCard,
  Smartphone,
  Building2,
  TrendingUp,
  History,
  Send,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Transaction {
  id: string;
  type: "credit" | "debit" | "transfer";
  amount: number;
  description: string;
  date: string;
  reference: string;
  status: "completed" | "pending" | "failed";
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: "1", type: "credit", amount: 500, description: "Wallet top-up via EcoCash", date: "2024-01-18", reference: "TXN-001", status: "completed" },
  { id: "2", type: "debit", amount: 150, description: "Payment for Consultation", date: "2024-01-15", reference: "TXN-002", status: "completed" },
  { id: "3", type: "debit", amount: 75, description: "Lab Test Payment", date: "2024-01-12", reference: "TXN-003", status: "completed" },
  { id: "4", type: "credit", amount: 1000, description: "Diaspora remittance", date: "2024-01-10", reference: "TXN-004", status: "completed" },
  { id: "5", type: "transfer", amount: 200, description: "Transfer to Family Member", date: "2024-01-08", reference: "TXN-005", status: "completed" },
];

const TOP_UP_AMOUNTS = [50, 100, 200, 500, 1000];

export function HealthWallet() {
  const [walletBalance, setWalletBalance] = useState(1250.00);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [showTopUpDialog, setShowTopUpDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [topUpMethod, setTopUpMethod] = useState<string>("");
  const [processing, setProcessing] = useState(false);

  const handleTopUp = async () => {
    const amount = topUpAmount || parseFloat(customAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setWalletBalance(prev => prev + amount);
    setTransactions(prev => [{
      id: Date.now().toString(),
      type: "credit",
      amount,
      description: `Wallet top-up via ${topUpMethod}`,
      date: new Date().toISOString().split('T')[0],
      reference: `TXN-${Date.now()}`,
      status: "completed"
    }, ...prev]);
    
    setProcessing(false);
    setShowTopUpDialog(false);
    setTopUpAmount(null);
    setCustomAmount("");
    toast.success(`Successfully added $${amount.toFixed(2)} to your wallet`);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "credit": return ArrowDownLeft;
      case "debit": return ArrowUpRight;
      case "transfer": return Send;
      default: return RefreshCw;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "credit": return "text-success";
      case "debit": return "text-destructive";
      default: return "text-primary";
    }
  };

  return (
    <div className="space-y-6">
      {/* Wallet Balance Card */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-80">Health Wallet Balance</p>
                <p className="text-3xl font-bold">${walletBalance.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                onClick={() => setShowTopUpDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Funds
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setShowTransferDialog(true)}
              >
                <Send className="h-4 w-4 mr-2" />
                Transfer
              </Button>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-xs opacity-80">This Month</p>
              <p className="text-lg font-semibold">+$1,500</p>
              <p className="text-xs text-success flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> 12% up
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-xs opacity-80">Spent</p>
              <p className="text-lg font-semibold">-$425</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-xs opacity-80">Pending</p>
              <p className="text-lg font-semibold">$0.00</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setShowTopUpDialog(true)}>
          <CardContent className="p-4 text-center">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium">Top Up</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardContent className="p-4 text-center">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Send className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium">Transfer</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardContent className="p-4 text-center">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium">Family</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardContent className="p-4 text-center">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <History className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium">History</p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Transaction History</CardTitle>
              <CardDescription>Recent wallet activity</CardDescription>
            </div>
            <Button variant="outline" size="sm">View All</Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {transactions.map(tx => {
                const Icon = getTransactionIcon(tx.type);
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        tx.type === "credit" ? "bg-success/10" : 
                        tx.type === "debit" ? "bg-destructive/10" : "bg-primary/10"
                      }`}>
                        <Icon className={`h-5 w-5 ${getTransactionColor(tx.type)}`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tx.date), 'MMM dd, yyyy')} • {tx.reference}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${getTransactionColor(tx.type)}`}>
                        {tx.type === "credit" ? "+" : "-"}${tx.amount.toFixed(2)}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Top Up Dialog */}
      <Dialog open={showTopUpDialog} onOpenChange={setShowTopUpDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Funds to Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Amount Selection */}
            <div className="space-y-3">
              <Label>Select Amount</Label>
              <div className="grid grid-cols-5 gap-2">
                {TOP_UP_AMOUNTS.map(amount => (
                  <Button
                    key={amount}
                    variant={topUpAmount === amount ? "default" : "outline"}
                    className="h-12"
                    onClick={() => {
                      setTopUpAmount(amount);
                      setCustomAmount("");
                    }}
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  placeholder="Other amount"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setTopUpAmount(null);
                  }}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={topUpMethod === "ecocash" ? "default" : "outline"}
                  className="h-auto py-3 flex flex-col gap-1"
                  onClick={() => setTopUpMethod("ecocash")}
                >
                  <Smartphone className="h-5 w-5" />
                  <span className="text-xs">EcoCash</span>
                </Button>
                <Button
                  variant={topUpMethod === "card" ? "default" : "outline"}
                  className="h-auto py-3 flex flex-col gap-1"
                  onClick={() => setTopUpMethod("card")}
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="text-xs">Card</span>
                </Button>
                <Button
                  variant={topUpMethod === "bank" ? "default" : "outline"}
                  className="h-auto py-3 flex flex-col gap-1"
                  onClick={() => setTopUpMethod("bank")}
                >
                  <Building2 className="h-5 w-5" />
                  <span className="text-xs">Bank</span>
                </Button>
              </div>
            </div>

            <Button 
              className="w-full" 
              size="lg"
              disabled={(!topUpAmount && !customAmount) || !topUpMethod || processing}
              onClick={handleTopUp}
            >
              {processing ? "Processing..." : `Add $${(topUpAmount || parseFloat(customAmount) || 0).toFixed(2)}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer Funds</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Recipient</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select family member or enter details" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spouse">Spouse - Jane Doe</SelectItem>
                  <SelectItem value="child">Child - John Jr.</SelectItem>
                  <SelectItem value="other">Other Recipient</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input type="number" placeholder="0.00" className="pl-8" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Input placeholder="What's this for?" />
            </div>
            <Button className="w-full" size="lg">
              Transfer Funds
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
