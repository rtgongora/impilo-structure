import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  CheckCircle,
  XCircle,
  Loader2,
  Scan,
  Keyboard,
} from "lucide-react";
import { toast } from "sonner";

interface BarcodeScannerProps {
  expectedBarcode?: string;
  medicationName: string;
  onVerified: () => void;
  onCancel: () => void;
  open: boolean;
}

export function BarcodeScanner({
  expectedBarcode,
  medicationName,
  onVerified,
  onCancel,
  open,
}: BarcodeScannerProps) {
  const [mode, setMode] = useState<"camera" | "manual">("manual");
  const [manualCode, setManualCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "verified" | "failed">("pending");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (mode === "camera" && open) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [mode, open]);

  const startCamera = async () => {
    try {
      setIsScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Camera access error:", error);
      toast.error("Unable to access camera. Please use manual entry.");
      setMode("manual");
    } finally {
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const verifyBarcode = (scannedCode: string) => {
    // If no expected barcode is set, accept any scan as verified
    if (!expectedBarcode) {
      setVerificationStatus("verified");
      toast.success("Medication verified");
      setTimeout(() => {
        onVerified();
      }, 1000);
      return;
    }

    // Check if the scanned code matches
    if (scannedCode.trim().toUpperCase() === expectedBarcode.toUpperCase()) {
      setVerificationStatus("verified");
      toast.success("Medication verified - barcode matches");
      setTimeout(() => {
        onVerified();
      }, 1000);
    } else {
      setVerificationStatus("failed");
      toast.error("Barcode does not match expected medication!");
    }
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) {
      toast.error("Please enter a barcode");
      return;
    }
    verifyBarcode(manualCode);
  };

  const simulateScan = () => {
    // Simulate a successful scan for demo purposes
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      if (expectedBarcode) {
        verifyBarcode(expectedBarcode);
      } else {
        verifyBarcode("SCANNED-CODE");
      }
    }, 1500);
  };

  const resetVerification = () => {
    setVerificationStatus("pending");
    setManualCode("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Verify Medication
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Medication Info */}
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="font-medium">{medicationName}</p>
            {expectedBarcode && (
              <p className="text-xs text-muted-foreground mt-1">
                Expected: {expectedBarcode}
              </p>
            )}
          </div>

          {/* Verification Status */}
          {verificationStatus !== "pending" && (
            <div
              className={`p-4 rounded-lg text-center ${
                verificationStatus === "verified"
                  ? "bg-emerald-500/10 border border-emerald-500/20"
                  : "bg-destructive/10 border border-destructive/20"
              }`}
            >
              {verificationStatus === "verified" ? (
                <>
                  <CheckCircle className="h-12 w-12 mx-auto text-emerald-500 mb-2" />
                  <p className="font-medium text-emerald-600 dark:text-emerald-400">
                    Medication Verified
                  </p>
                </>
              ) : (
                <>
                  <XCircle className="h-12 w-12 mx-auto text-destructive mb-2" />
                  <p className="font-medium text-destructive">
                    Verification Failed
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Barcode does not match expected medication
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={resetVerification}
                  >
                    Try Again
                  </Button>
                </>
              )}
            </div>
          )}

          {verificationStatus === "pending" && (
            <>
              {/* Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={mode === "camera" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setMode("camera")}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Camera
                </Button>
                <Button
                  variant={mode === "manual" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setMode("manual")}
                >
                  <Keyboard className="h-4 w-4 mr-2" />
                  Manual
                </Button>
              </div>

              {mode === "camera" ? (
                <div className="space-y-3">
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    {/* Scan overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-32 border-2 border-primary rounded-lg opacity-50" />
                    </div>
                    {isScanning && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                  <Button className="w-full" onClick={simulateScan} disabled={isScanning}>
                    {isScanning ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Scan className="h-4 w-4 mr-2" />
                        Capture & Verify
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Position barcode within the frame and tap to scan
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Enter Barcode Manually</Label>
                    <Input
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="Scan or type barcode..."
                      onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                    />
                  </div>
                  <Button className="w-full" onClick={handleManualSubmit}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify Barcode
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Skip verification option */}
          {verificationStatus === "pending" && !expectedBarcode && (
            <div className="text-center pt-2 border-t">
              <Button variant="ghost" size="sm" onClick={onVerified}>
                Skip Verification (No barcode on file)
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
