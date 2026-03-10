import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  QrCode,
  Keyboard,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  User,
  Calendar,
  Ticket,
  CreditCard,
  Loader2,
  Camera,
  RefreshCw,
  ArrowRight,
  Printer,
  Home,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";

interface CheckInResult {
  success: boolean;
  message: string;
  appointment?: {
    id: string;
    referenceNumber: string;
    patientName: string;
    department: string;
    provider?: string;
    scheduledTime: string;
    room?: string;
    isPaid: boolean;
    amountDue?: number;
  };
  queueToken?: {
    number: string;
    estimatedWait: number;
    position: number;
  };
}

interface SelfCheckInKioskProps {
  onCheckIn?: (referenceNumber: string) => Promise<CheckInResult>;
  facilityName?: string;
}

export function SelfCheckInKiosk({ onCheckIn, facilityName = "Impilo Health" }: SelfCheckInKioskProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"qr" | "reference" | "search">("qr");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Mock check-in function if none provided
  const performCheckIn = async (ref: string): Promise<CheckInResult> => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (onCheckIn) {
      const result = await onCheckIn(ref);
      setLoading(false);
      return result;
    }

    // Mock response
    const mockResult: CheckInResult = {
      success: true,
      message: "Check-in successful!",
      appointment: {
        id: "apt-123",
        referenceNumber: ref,
        patientName: "John Doe",
        department: "General Medicine",
        provider: "Dr. Smith",
        scheduledTime: "10:30 AM",
        room: "Room 204",
        isPaid: Math.random() > 0.5,
        amountDue: 50,
      },
      queueToken: {
        number: `Q-${Math.floor(Math.random() * 100).toString().padStart(3, '0')}`,
        estimatedWait: Math.floor(Math.random() * 30) + 5,
        position: Math.floor(Math.random() * 10) + 1,
      },
    };
    
    setLoading(false);
    return mockResult;
  };

  const handleReferenceSubmit = async () => {
    if (!referenceNumber.trim()) {
      toast.error("Please enter a reference number");
      return;
    }

    const result = await performCheckIn(referenceNumber);
    setCheckInResult(result);
    setShowResult(true);
  };

  const handleQRScan = async (data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.ref) {
        setScanning(false);
        const result = await performCheckIn(parsed.ref);
        setCheckInResult(result);
        setShowResult(true);
      }
    } catch {
      // Try as plain reference number
      const result = await performCheckIn(data);
      setCheckInResult(result);
      setShowResult(true);
    }
  };

  const startScanning = async () => {
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast.error("Unable to access camera. Please use reference number instead.");
      setScanning(false);
      setMode("reference");
    }
  };

  const stopScanning = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setScanning(false);
  };

  const handleNewCheckIn = () => {
    setShowResult(false);
    setCheckInResult(null);
    setReferenceNumber("");
    setSearchTerm("");
    setMode("qr");
  };

  const printToken = () => {
    toast.success("Printing queue token...");
    // In real implementation, trigger print dialog or send to printer
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  if (showResult && checkInResult) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            {checkInResult.success ? (
              <>
                <div className="mx-auto w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </div>
                <CardTitle className="text-2xl">Check-in Complete!</CardTitle>
                <CardDescription>Welcome, {checkInResult.appointment?.patientName}</CardDescription>
              </>
            ) : (
              <>
                <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <AlertCircle className="w-10 h-10 text-destructive" />
                </div>
                <CardTitle className="text-2xl">Check-in Failed</CardTitle>
                <CardDescription>{checkInResult.message}</CardDescription>
              </>
            )}
          </CardHeader>

          {checkInResult.success && checkInResult.queueToken && (
            <CardContent className="space-y-6">
              {/* Queue Token */}
              <div className="bg-primary/5 border-2 border-primary rounded-xl p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">Your Queue Number</p>
                <p className="text-5xl font-bold tracking-wider text-primary">
                  {checkInResult.queueToken.number}
                </p>
                <div className="mt-4 flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>~{checkInResult.queueToken.estimatedWait} min wait</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Position #{checkInResult.queueToken.position}</span>
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              {checkInResult.appointment && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{checkInResult.appointment.department}</span>
                    {checkInResult.appointment.room && (
                      <Badge variant="outline">{checkInResult.appointment.room}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Scheduled: {checkInResult.appointment.scheduledTime}</span>
                  </div>
                  {checkInResult.appointment.provider && (
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{checkInResult.appointment.provider}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Alert */}
              {checkInResult.appointment && !checkInResult.appointment.isPaid && checkInResult.appointment.amountDue && (
                <Alert variant="destructive">
                  <CreditCard className="h-4 w-4" />
                  <AlertTitle>Payment Required</AlertTitle>
                  <AlertDescription>
                    Amount due: ${checkInResult.appointment.amountDue.toFixed(2)}
                    <br />
                    Please proceed to the payment counter.
                  </AlertDescription>
                </Alert>
              )}

              <Separator />

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={printToken}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Token
                </Button>
                <Button onClick={handleNewCheckIn}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  New Check-in
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Please proceed to the waiting area.
                <br />
                You will be called when it's your turn.
              </p>
            </CardContent>
          )}

          {!checkInResult.success && (
            <CardContent>
              <Button className="w-full" onClick={handleNewCheckIn}>
                Try Again
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg mb-4 flex justify-start">
        <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
          <Home className="h-4 w-4 mr-1" />
          Back to Login
        </Button>
      </div>
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
              <Ticket className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Self Check-In</CardTitle>
          <CardDescription>
            Welcome to {facilityName}
            <br />
            Please check in for your appointment
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="qr" className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                Scan QR
              </TabsTrigger>
              <TabsTrigger value="reference" className="flex items-center gap-2">
                <Keyboard className="h-4 w-4" />
                Reference
              </TabsTrigger>
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </TabsTrigger>
            </TabsList>

            <TabsContent value="qr" className="mt-6">
              <div className="text-center space-y-4">
                {scanning ? (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full aspect-square rounded-lg bg-black"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 border-4 border-primary rounded-lg" />
                    </div>
                    <Button 
                      variant="outline" 
                      className="absolute bottom-4 left-1/2 -translate-x-1/2"
                      onClick={stopScanning}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="w-48 h-48 mx-auto border-4 border-dashed border-primary/30 rounded-xl flex items-center justify-center">
                      <Camera className="h-16 w-16 text-primary/30" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Position your booking QR code within the frame
                    </p>
                    <Button size="lg" onClick={startScanning}>
                      <Camera className="h-5 w-5 mr-2" />
                      Start Scanning
                    </Button>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="reference" className="mt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reference">Booking Reference Number</Label>
                  <Input
                    id="reference"
                    placeholder="e.g., BK-20241220-ABCD"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value.toUpperCase())}
                    className="text-center text-lg font-mono tracking-wider h-14"
                    onKeyDown={(e) => e.key === 'Enter' && handleReferenceSubmit()}
                  />
                </div>
                <Button 
                  className="w-full h-12" 
                  onClick={handleReferenceSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Checking in...
                    </>
                  ) : (
                    <>
                      Check In
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="search" className="mt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="search">Search by Name or ID</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Enter your name or ID number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-14"
                    />
                  </div>
                </div>
                <Button className="w-full h-12" disabled={!searchTerm.trim()}>
                  <Search className="h-5 w-5 mr-2" />
                  Find Appointment
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Enter your full name or national ID to find your appointment
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Don't have a booking?
            </p>
            <Button variant="outline">
              Walk-in Registration
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
