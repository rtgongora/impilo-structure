import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard,
  Smartphone,
  Wallet,
  Building2,
  QrCode,
  DollarSign,
  Plus,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";

interface PaymentMethod {
  id: string;
  type: "card" | "mobile" | "bank" | "wallet";
  name: string;
  details: string;
  isDefault: boolean;
}

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  { id: "1", type: "card", name: "Visa ending in 4242", details: "Expires 12/25", isDefault: true },
  { id: "2", type: "mobile", name: "EcoCash", details: "+263 77 123 4567", isDefault: false },
  { id: "3", type: "wallet", name: "Health Wallet", details: "Balance: $1,250.00", isDefault: false },
];

const MOBILE_MONEY_PROVIDERS = [
  { id: "ecocash", name: "EcoCash", icon: "🟢" },
  { id: "onemoney", name: "OneMoney", icon: "🔵" },
  { id: "innbucks", name: "InnBucks", icon: "🟡" },
];

interface PaymentMethodsProps {
  amount?: number;
  onPaymentComplete?: (method: string, reference: string) => void;
}

export function PaymentMethods({ amount, onPaymentComplete }: PaymentMethodsProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(MOCK_PAYMENT_METHODS);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [showAddMethodDialog, setShowAddMethodDialog] = useState(false);
  const [activeAddTab, setActiveAddTab] = useState("card");
  const [processing, setProcessing] = useState(false);

  const getMethodIcon = (type: string) => {
    switch (type) {
      case "card": return CreditCard;
      case "mobile": return Smartphone;
      case "bank": return Building2;
      case "wallet": return Wallet;
      default: return DollarSign;
    }
  };

  const setDefaultMethod = (id: string) => {
    setPaymentMethods(prev => prev.map(m => ({
      ...m,
      isDefault: m.id === id
    })));
    toast.success("Default payment method updated");
  };

  const processPayment = async () => {
    if (!selectedMethod || !amount) return;
    
    setProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const reference = `TXN-${Date.now()}`;
    setProcessing(false);
    toast.success("Payment successful!");
    onPaymentComplete?.(selectedMethod, reference);
  };

  return (
    <div className="space-y-6">
      {/* Amount Display (if in payment mode) */}
      {amount && (
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Amount to Pay</p>
            <p className="text-4xl font-bold">${amount.toFixed(2)}</p>
          </CardContent>
        </Card>
      )}

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Payment Methods</CardTitle>
              <CardDescription>Choose how you want to pay</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAddMethodDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Method
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedMethod || ""} onValueChange={setSelectedMethod}>
            <div className="space-y-3">
              {paymentMethods.map(method => {
                const Icon = getMethodIcon(method.type);
                return (
                  <label
                    key={method.id}
                    className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedMethod === method.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <RadioGroupItem value={method.id} />
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{method.name}</p>
                          {method.isDefault && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{method.details}</p>
                      </div>
                    </div>
                    {!method.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          setDefaultMethod(method.id);
                        }}
                      >
                        Set Default
                      </Button>
                    )}
                  </label>
                );
              })}
            </div>
          </RadioGroup>

          {/* Quick Pay Options */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm font-medium mb-4">Quick Pay</p>
            <div className="grid grid-cols-3 gap-4">
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
                <QrCode className="h-6 w-6" />
                <span className="text-xs">Scan QR</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
                <Smartphone className="h-6 w-6" />
                <span className="text-xs">USSD</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
                <Building2 className="h-6 w-6" />
                <span className="text-xs">Bank Transfer</span>
              </Button>
            </div>
          </div>

          {/* Pay Button */}
          {amount && (
            <Button
              className="w-full mt-6"
              size="lg"
              disabled={!selectedMethod || processing}
              onClick={processPayment}
            >
              {processing ? (
                <>Processing...</>
              ) : (
                <>
                  Pay ${amount.toFixed(2)}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Add Payment Method Dialog */}
      <Dialog open={showAddMethodDialog} onOpenChange={setShowAddMethodDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
          </DialogHeader>
          <Tabs value={activeAddTab} onValueChange={setActiveAddTab}>
            <TabsList className="w-full">
              <TabsTrigger value="card" className="flex-1">Card</TabsTrigger>
              <TabsTrigger value="mobile" className="flex-1">Mobile Money</TabsTrigger>
              <TabsTrigger value="bank" className="flex-1">Bank</TabsTrigger>
            </TabsList>

            <TabsContent value="card" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Card Number</Label>
                <Input placeholder="4242 4242 4242 4242" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input placeholder="MM/YY" />
                </div>
                <div className="space-y-2">
                  <Label>CVV</Label>
                  <Input placeholder="123" type="password" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cardholder Name</Label>
                <Input placeholder="John Doe" />
              </div>
            </TabsContent>

            <TabsContent value="mobile" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Select Provider</Label>
                <div className="grid grid-cols-3 gap-2">
                  {MOBILE_MONEY_PROVIDERS.map(provider => (
                    <Button
                      key={provider.id}
                      variant="outline"
                      className="h-auto py-4 flex flex-col gap-2"
                    >
                      <span className="text-2xl">{provider.icon}</span>
                      <span className="text-xs">{provider.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mobile Number</Label>
                <Input placeholder="+263 77 XXX XXXX" />
              </div>
            </TabsContent>

            <TabsContent value="bank" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input placeholder="Select or enter bank name" />
              </div>
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input placeholder="Enter account number" />
              </div>
              <div className="space-y-2">
                <Label>Branch Code</Label>
                <Input placeholder="Enter branch code" />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setShowAddMethodDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast.success("Payment method added");
              setShowAddMethodDialog(false);
            }}>
              Add Method
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
