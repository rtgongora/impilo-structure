import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useCashReconciliations } from "@/hooks/usePaymentOrchestrator";
import { useReceipts } from "@/hooks/usePaymentOrchestrator";
import { 
  DollarSign,
  Calculator,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Calendar,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Banknote,
  Receipt
} from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";

export function CashReconciliation() {
  const { reconciliations, loading, createReconciliation, submitReconciliation, refetch } = useCashReconciliations();
  const { receipts } = useReceipts();

  const [showNewReconciliation, setShowNewReconciliation] = useState(false);
  const [reconciliationForm, setReconciliationForm] = useState({
    openingBalance: "",
    actualCash: "",
    notes: "",
    varianceExplanation: ""
  });

  // Calculate today's cash receipts
  const today = new Date();
  const todayReceipts = receipts.filter(r => {
    const receiptDate = new Date(r.receipt_date);
    return receiptDate >= startOfDay(today) && 
           receiptDate <= endOfDay(today) &&
           r.payment_method === "cash";
  });
  const todayTotal = todayReceipts.reduce((sum, r) => sum + r.amount, 0);
  const todayRefunds = 0; // Would come from refunds table

  // Get today's reconciliation if exists
  const todayReconciliation = reconciliations.find(r => {
    const recDate = new Date(r.reconciliation_date);
    return recDate.toDateString() === today.toDateString();
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-success text-success-foreground"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
      case "submitted":
        return <Badge className="bg-primary text-primary-foreground"><Clock className="h-3 w-3 mr-1" />Submitted</Badge>;
      case "pending":
        return <Badge className="bg-warning text-warning-foreground"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "rejected":
        return <Badge className="bg-destructive text-destructive-foreground"><AlertTriangle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleCreateReconciliation = async () => {
    const opening = parseFloat(reconciliationForm.openingBalance) || 0;
    const actual = parseFloat(reconciliationForm.actualCash) || 0;
    const expected = opening + todayTotal - todayRefunds;

    try {
      await createReconciliation({
        facility_id: "00000000-0000-0000-0000-000000000001", // Default facility - would come from context
        reconciliation_date: format(today, "yyyy-MM-dd"),
        opening_balance: opening,
        expected_cash: expected,
        actual_cash: actual,
      });
      toast.success("Reconciliation created successfully");
      setShowNewReconciliation(false);
      setReconciliationForm({
        openingBalance: "",
        actualCash: "",
        notes: "",
        varianceExplanation: ""
      });
    } catch (err) {
      toast.error("Failed to create reconciliation");
    }
  };

  const expectedCash = (parseFloat(reconciliationForm.openingBalance) || 0) + todayTotal - todayRefunds;
  const actualCash = parseFloat(reconciliationForm.actualCash) || 0;
  const variance = actualCash - expectedCash;

  return (
    <div className="space-y-6">
      {/* Today's Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Banknote className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Cash Receipts</p>
                <p className="text-2xl font-bold">${todayTotal.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cash Transactions</p>
                <p className="text-2xl font-bold">{todayReceipts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Refunds</p>
                <p className="text-2xl font-bold">${todayRefunds.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg ${todayReconciliation ? "bg-success/10" : "bg-warning/10"} flex items-center justify-center`}>
                <Calculator className={`h-5 w-5 ${todayReconciliation ? "text-success" : "text-warning"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Status</p>
                <p className="text-lg font-bold">
                  {todayReconciliation ? (
                    <span className="text-success">Reconciled</span>
                  ) : (
                    <span className="text-warning">Pending</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Reconciliation */}
      {!todayReconciliation && (
        <Card className="border-warning">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div>
                  <CardTitle className="text-base">End of Day Reconciliation</CardTitle>
                  <CardDescription>Complete today's cash reconciliation</CardDescription>
                </div>
              </div>
              <Dialog open={showNewReconciliation} onOpenChange={setShowNewReconciliation}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Start Reconciliation
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Cash Reconciliation - {format(today, "dd MMM yyyy")}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {/* System Summary */}
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <h4 className="font-medium">System Records</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Cash Receipts</p>
                          <p className="font-bold text-success">${todayTotal.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Refunds</p>
                          <p className="font-bold text-destructive">${todayRefunds.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Transactions</p>
                          <p className="font-bold">{todayReceipts.length}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Net Cash</p>
                          <p className="font-bold">${(todayTotal - todayRefunds).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Manual Input */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Opening Balance (Float)</Label>
                        <Input
                          type="number"
                          value={reconciliationForm.openingBalance}
                          onChange={(e) => setReconciliationForm(p => ({ ...p, openingBalance: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Actual Cash in Drawer</Label>
                        <Input
                          type="number"
                          value={reconciliationForm.actualCash}
                          onChange={(e) => setReconciliationForm(p => ({ ...p, actualCash: e.target.value }))}
                          placeholder="Count the cash..."
                        />
                      </div>

                      {reconciliationForm.actualCash && (
                        <div className={`p-4 rounded-lg ${Math.abs(variance) < 0.01 ? "bg-success/10" : variance > 0 ? "bg-primary/10" : "bg-destructive/10"}`}>
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Expected</span>
                            <span>${expectedCash.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Actual</span>
                            <span>${actualCash.toFixed(2)}</span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex items-center justify-between">
                            <span className="font-bold">Variance</span>
                            <span className={`font-bold flex items-center gap-1 ${
                              Math.abs(variance) < 0.01 ? "text-success" : 
                              variance > 0 ? "text-primary" : "text-destructive"
                            }`}>
                              {variance > 0 && <TrendingUp className="h-4 w-4" />}
                              {variance < 0 && <TrendingDown className="h-4 w-4" />}
                              {variance > 0 ? "+" : ""}${variance.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}

                      {Math.abs(variance) >= 0.01 && reconciliationForm.actualCash && (
                        <div className="space-y-2">
                          <Label>Variance Explanation *</Label>
                          <Textarea
                            value={reconciliationForm.varianceExplanation}
                            onChange={(e) => setReconciliationForm(p => ({ ...p, varianceExplanation: e.target.value }))}
                            placeholder="Explain the variance..."
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                          value={reconciliationForm.notes}
                          onChange={(e) => setReconciliationForm(p => ({ ...p, notes: e.target.value }))}
                          placeholder="Additional notes..."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowNewReconciliation(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleCreateReconciliation}
                        disabled={!reconciliationForm.actualCash || (Math.abs(variance) >= 0.01 && !reconciliationForm.varianceExplanation)}
                      >
                        Submit Reconciliation
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Reconciliation History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Reconciliation History</CardTitle>
              <CardDescription>Past cash reconciliations</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : reconciliations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calculator className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No reconciliations found</p>
                </div>
              ) : (
                reconciliations.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {format(new Date(rec.reconciliation_date), "EEEE, dd MMM yyyy")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {rec.transactions_count || 0} transactions
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-medium">Expected: ${rec.expected_cash.toFixed(2)}</p>
                        <p className="text-sm">Actual: ${(rec.actual_cash || 0).toFixed(2)}</p>
                      </div>
                      <div className={`text-right ${
                        Math.abs(rec.variance || 0) < 0.01 ? "text-success" : 
                        (rec.variance || 0) > 0 ? "text-primary" : "text-destructive"
                      }`}>
                        <p className="font-bold flex items-center gap-1">
                          {(rec.variance || 0) > 0 && <TrendingUp className="h-4 w-4" />}
                          {(rec.variance || 0) < 0 && <TrendingDown className="h-4 w-4" />}
                          {(rec.variance || 0) >= 0 ? "+" : ""}${(rec.variance || 0).toFixed(2)}
                        </p>
                      </div>
                      {getStatusBadge(rec.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}