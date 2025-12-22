import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CreditCard,
  Wallet,
  Smartphone,
  Building2,
  CheckCircle2,
  Loader2,
  Shield,
  Clock,
  Gift,
  Percent,
} from "lucide-react";
import { toast } from "sonner";

interface PaymentItem {
  description: string;
  amount: number;
  type: "consultation" | "procedure" | "lab" | "other";
}

interface AdvancePaymentProps {
  bookingReference: string;
  patientName: string;
  appointmentDate: string;
  items: PaymentItem[];
  discount?: {
    type: "percentage" | "fixed";
    value: number;
    reason: string;
  };
  onPaymentComplete?: (transactionId: string) => void;
  onCancel?: () => void;
}

type PaymentMethod = "card" | "wallet" | "mobile" | "bank";

export function AdvancePayment({
  bookingReference,
  patientName,
  appointmentDate,
  items,
  discount,
  onPaymentComplete,
  onCancel,
}: AdvancePaymentProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [processing, setProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [transactionId, setTransactionId] = useState<string>("");

  // Card details
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

  // Mobile money
  const [mobileNumber, setMobileNumber] = useState("");

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const discountAmount = discount
    ? discount.type === "percentage"
      ? subtotal * (discount.value / 100)
      : discount.value
    : 0;
  const total = subtotal - discountAmount;

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(" ") : cleaned;
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handlePayment = async () => {
    setProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const txnId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setTransactionId(txnId);
    setPaymentComplete(true);
    setProcessing(false);

    toast.success("Payment successful!");
    if (onPaymentComplete) {
      onPaymentComplete(txnId);
    }
  };

  if (paymentComplete) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <CardTitle>Payment Successful!</CardTitle>
          <CardDescription>Your payment has been processed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transaction ID</span>
              <span className="font-mono">{transactionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount Paid</span>
              <span className="font-semibold">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Booking Reference</span>
              <span className="font-mono">{bookingReference}</span>
            </div>
          </div>

          <Alert>
            <Gift className="h-4 w-4" />
            <AlertDescription>
              <strong>Early Payment Benefit:</strong> You can skip the payment queue on arrival. Just scan your QR code
              at the check-in kiosk.
            </AlertDescription>
          </Alert>

          <Button className="w-full" onClick={onCancel}>
            Done
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Advance Payment
        </CardTitle>
        <CardDescription>Pay now and skip the queue on arrival</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Booking Summary */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Booking Ref</span>
            <span className="font-mono">{bookingReference}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Patient</span>
            <span>{patientName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Appointment</span>
            <span>{appointmentDate}</span>
          </div>
        </div>

        {/* Itemized Charges */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Charges</h4>
          {items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.description}</span>
              <span>${item.amount.toFixed(2)}</span>
            </div>
          ))}

          {discount && (
            <div className="flex justify-between text-sm text-success">
              <span className="flex items-center gap-1">
                <Percent className="h-3 w-3" />
                {discount.reason}
              </span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
          )}

          <Separator />

          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Payment Method</h4>
          <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
            <div
              className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                paymentMethod === "card" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
              }`}
              onClick={() => setPaymentMethod("card")}
            >
              <RadioGroupItem value="card" id="card" />
              <CreditCard className="h-4 w-4" />
              <Label htmlFor="card" className="flex-1 cursor-pointer">
                Credit/Debit Card
              </Label>
            </div>

            <div
              className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                paymentMethod === "wallet" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
              }`}
              onClick={() => setPaymentMethod("wallet")}
            >
              <RadioGroupItem value="wallet" id="wallet" />
              <Wallet className="h-4 w-4" />
              <Label htmlFor="wallet" className="flex-1 cursor-pointer">
                Health Wallet
              </Label>
              <Badge variant="secondary">$1,250.00</Badge>
            </div>

            <div
              className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                paymentMethod === "mobile" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
              }`}
              onClick={() => setPaymentMethod("mobile")}
            >
              <RadioGroupItem value="mobile" id="mobile" />
              <Smartphone className="h-4 w-4" />
              <Label htmlFor="mobile" className="flex-1 cursor-pointer">
                Mobile Money
              </Label>
            </div>

            <div
              className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                paymentMethod === "bank" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
              }`}
              onClick={() => setPaymentMethod("bank")}
            >
              <RadioGroupItem value="bank" id="bank" />
              <Building2 className="h-4 w-4" />
              <Label htmlFor="bank" className="flex-1 cursor-pointer">
                Bank Transfer
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Payment Details Form */}
        {paymentMethod === "card" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={19}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  placeholder="MM/YY"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                  maxLength={5}
                />
              </div>
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  maxLength={4}
                  type="password"
                />
              </div>
            </div>
          </div>
        )}

        {paymentMethod === "mobile" && (
          <div>
            <Label htmlFor="mobile">Mobile Number</Label>
            <Input
              id="mobile"
              placeholder="+263 77 123 4567"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">You will receive a payment prompt on this number</p>
          </div>
        )}

        {paymentMethod === "bank" && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Bank transfers may take 1-2 business days to reflect. Your booking will be held pending payment
              confirmation.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>Your payment is secured with 256-bit encryption</span>
        </div>
      </CardContent>

      <CardFooter className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onCancel} disabled={processing}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={handlePayment} disabled={processing}>
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>Pay ${total.toFixed(2)}</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
