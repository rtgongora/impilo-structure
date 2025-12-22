import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  MapPin,
  QrCode,
  Download,
  Share2,
  CheckCircle2,
  Copy,
  CreditCard,
  Wallet,
  Smartphone,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface BookingDetails {
  id: string;
  referenceNumber: string;
  patientName: string;
  patientMrn: string;
  appointmentType: string;
  department: string;
  provider?: string;
  scheduledDate: Date;
  scheduledTime: string;
  location?: string;
  room?: string;
  estimatedFee?: number;
  isPaid?: boolean;
  paymentMethod?: string;
  qrData: string;
}

interface BookingConfirmationProps {
  booking: BookingDetails;
  onPayNow?: () => void;
  onClose?: () => void;
}

export function BookingConfirmation({ booking, onPayNow, onClose }: BookingConfirmationProps) {
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  useEffect(() => {
    // Generate QR code using a simple QR API
    const qrData = encodeURIComponent(JSON.stringify({
      ref: booking.referenceNumber,
      id: booking.id,
      patient: booking.patientMrn,
      date: format(booking.scheduledDate, 'yyyy-MM-dd'),
      time: booking.scheduledTime,
    }));
    setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`);
  }, [booking]);

  const copyReferenceNumber = () => {
    navigator.clipboard.writeText(booking.referenceNumber);
    setCopied(true);
    toast.success("Reference number copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `booking-${booking.referenceNumber}.png`;
    link.click();
    toast.success("QR code downloaded");
  };

  const shareBooking = async () => {
    const shareData = {
      title: 'Appointment Booking Confirmation',
      text: `Your appointment is confirmed!\nReference: ${booking.referenceNumber}\nDate: ${format(booking.scheduledDate, 'PPP')}\nTime: ${booking.scheduledTime}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(shareData.text);
      toast.success("Booking details copied to clipboard");
    }
  };

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <CardTitle className="text-xl">Booking Confirmed!</CardTitle>
        <CardDescription>
          Your appointment has been scheduled successfully
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Reference Number */}
        <div className="bg-muted rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Reference Number</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-mono font-bold tracking-wider">
              {booking.referenceNumber}
            </span>
            <Button variant="ghost" size="icon" onClick={copyReferenceNumber}>
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Use this reference or scan QR code on arrival
          </p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-lg border-2 border-dashed">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="Booking QR Code" className="w-48 h-48" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-muted">
                <QrCode className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Appointment Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{format(booking.scheduledDate, 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{booking.scheduledTime}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{booking.department}{booking.room && `, ${booking.room}`}</span>
          </div>
          {booking.provider && (
            <p className="text-sm text-muted-foreground ml-7">
              Provider: {booking.provider}
            </p>
          )}
        </div>

        <Separator />

        {/* Payment Status */}
        {booking.estimatedFee && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Consultation Fee</span>
              <span className="font-semibold">${booking.estimatedFee.toFixed(2)}</span>
            </div>
            {booking.isPaid ? (
              <div className="flex items-center justify-between bg-success/10 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium">Paid</span>
                </div>
                <Badge variant="outline">{booking.paymentMethod}</Badge>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Pay now to skip the payment queue on arrival
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" onClick={onPayNow} className="flex-col h-auto py-3">
                    <CreditCard className="h-4 w-4 mb-1" />
                    <span className="text-xs">Card</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={onPayNow} className="flex-col h-auto py-3">
                    <Wallet className="h-4 w-4 mb-1" />
                    <span className="text-xs">Wallet</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={onPayNow} className="flex-col h-auto py-3">
                    <Smartphone className="h-4 w-4 mb-1" />
                    <span className="text-xs">Mobile</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={downloadQR}>
            <Download className="h-4 w-4 mr-2" />
            Save QR
          </Button>
          <Button variant="outline" onClick={shareBooking}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Please arrive 15 minutes before your scheduled time.
          <br />
          Present your QR code or reference number at the check-in kiosk.
        </p>

        {onClose && (
          <Button className="w-full" onClick={onClose}>
            Done
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to generate booking reference
export function generateBookingReference(): string {
  const date = new Date();
  const datePart = format(date, 'yyyyMMdd');
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK-${datePart}-${randomPart}`;
}
