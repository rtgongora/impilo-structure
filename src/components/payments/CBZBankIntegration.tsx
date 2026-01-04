import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  Shield,
  Lock,
  CheckCircle2,
  Loader2,
  ArrowRight,
  QrCode,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "touchpay",
    name: "CBZ TouchPay",
    icon: <Smartphone className="h-6 w-6" />,
    description: "Pay using CBZ TouchPay mobile"
  },
  {
    id: "card",
    name: "CBZ Debit/Credit Card",
    icon: <CreditCard className="h-6 w-6" />,
    description: "Visa, Mastercard accepted"
  },
  {
    id: "ussd",
    name: "USSD Banking",
    icon: <Building2 className="h-6 w-6" />,
    description: "Pay via *230# USSD code"
  },
  {
    id: "qr",
    name: "QR Code Payment",
    icon: <QrCode className="h-6 w-6" />,
    description: "Scan to pay instantly"
  }
];

interface CBZBankIntegrationProps {
  amount?: number;
  currency?: string;
  reference?: string;
  onSuccess?: (transactionId: string) => void;
  onCancel?: () => void;
}

export function CBZBankIntegration({
  amount = 125.00,
  currency = "USD",
  reference = "INV-2024-001234",
  onSuccess,
  onCancel
}: CBZBankIntegrationProps) {
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<string>("touchpay");
  const [step, setStep] = useState<"method" | "details" | "processing" | "success">("method");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

  const handleProceed = () => {
    if (selectedMethod === "touchpay" && !phoneNumber) {
      toast({ title: "Enter phone number", variant: "destructive" });
      return;
    }
    if (selectedMethod === "card" && (!cardNumber || !expiryDate || !cvv)) {
      toast({ title: "Complete card details", variant: "destructive" });
      return;
    }
    
    setStep("processing");
    
    // Simulate payment processing
    setTimeout(() => {
      setStep("success");
      onSuccess?.("TXN-" + Math.random().toString(36).substr(2, 9).toUpperCase());
    }, 3000);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  if (step === "success") {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-success" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
          <p className="text-muted-foreground mb-6">
            Your payment of {currency} {amount.toFixed(2)} has been processed.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 text-left mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-mono">{reference}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transaction ID</span>
              <span className="font-mono">TXN-ABC123XYZ</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment Method</span>
              <span>{PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name}</span>
            </div>
          </div>
          <Button onClick={() => setStep("method")} className="w-full">
            Done
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "processing") {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="py-16 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-6" />
          <h3 className="text-xl font-semibold mb-2">Processing Payment</h3>
          <p className="text-muted-foreground">
            Please wait while we process your payment...
          </p>
          {selectedMethod === "touchpay" && (
            <p className="text-sm text-muted-foreground mt-4">
              Check your phone for the CBZ TouchPay prompt
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center border-b pb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">CBZ Bank</span>
        </div>
        <CardTitle className="text-2xl">
          {currency} {amount.toFixed(2)}
        </CardTitle>
        <CardDescription>Reference: {reference}</CardDescription>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {step === "method" && (
          <>
            <div>
              <Label className="text-sm font-medium mb-3 block">Select Payment Method</Label>
              <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
                {PAYMENT_METHODS.map((method) => (
                  <div
                    key={method.id}
                    className={cn(
                      "flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-all",
                      selectedMethod === method.id && "border-primary bg-primary/5"
                    )}
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <RadioGroupItem value={method.id} id={method.id} />
                    <div className="p-2 bg-muted rounded-lg">
                      {method.icon}
                    </div>
                    <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                      <p className="font-medium">{method.name}</p>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Button className="w-full" onClick={() => setStep("details")}>
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </>
        )}

        {step === "details" && (
          <>
            {selectedMethod === "touchpay" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">CBZ TouchPay Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+263 77 123 4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    You'll receive a push notification to approve
                  </p>
                </div>
              </div>
            )}

            {selectedMethod === "card" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                    className="mt-1 font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      maxLength={5}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      type="password"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      maxLength={4}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedMethod === "ussd" && (
              <div className="text-center p-6 bg-muted/50 rounded-lg">
                <Smartphone className="h-12 w-12 mx-auto mb-4 text-primary" />
                <p className="font-medium mb-2">Dial *230# on your phone</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Select "Make Payment" → Enter reference:
                </p>
                <code className="bg-background px-4 py-2 rounded font-mono text-lg">
                  {reference}
                </code>
              </div>
            )}

            {selectedMethod === "qr" && (
              <div className="text-center p-6">
                <div className="w-48 h-48 mx-auto bg-white p-4 rounded-lg border mb-4">
                  {/* Simulated QR Code */}
                  <div className="w-full h-full bg-gradient-to-br from-foreground/80 to-foreground grid grid-cols-8 gap-0.5 p-2 rounded">
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "rounded-sm",
                          Math.random() > 0.5 ? "bg-background" : "bg-transparent"
                        )}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Scan with CBZ TouchPay or any bank app
                </p>
                <Button variant="ghost" size="sm" className="mt-2">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh QR Code
                </Button>
              </div>
            )}

            <Separator />

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Secured by CBZ Bank 256-bit encryption</span>
              <Lock className="h-3 w-3 ml-auto" />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("method")}>
                Back
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleProceed}
                disabled={
                  (selectedMethod === "touchpay" && !phoneNumber) ||
                  (selectedMethod === "card" && (!cardNumber || !expiryDate || !cvv))
                }
              >
                Pay {currency} {amount.toFixed(2)}
              </Button>
            </div>
          </>
        )}

        {onCancel && (
          <Button variant="ghost" className="w-full" onClick={onCancel}>
            Cancel Payment
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
