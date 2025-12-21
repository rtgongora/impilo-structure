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
import {
  Camera,
  CheckCircle,
  XCircle,
  Loader2,
  Scan,
  Keyboard,
} from "lucide-react";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";

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
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "barcode-scanner-container";

  useEffect(() => {
    if (mode === "camera" && open && !isScanning) {
      startScanner();
    }
    return () => {
      stopScanner();
    };
  }, [mode, open]);

  useEffect(() => {
    if (!open) {
      setVerificationStatus("pending");
      setManualCode("");
      stopScanner();
    }
  }, [open]);

  const startScanner = async () => {
    try {
      setIsScanning(true);
      
      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const html5Qrcode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5Qrcode;

      await html5Qrcode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
        },
        (decodedText) => {
          verifyBarcode(decodedText);
          stopScanner();
        },
        () => {} // Ignore errors during scanning
      );
    } catch (error) {
      console.error("Scanner error:", error);
      toast.error("Camera access failed. Please use manual entry.");
      setMode("manual");
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (e) {
        // Ignore stop errors
      }
    }
    setIsScanning(false);
  };

  const verifyBarcode = (scannedCode: string) => {
    if (!expectedBarcode) {
      setVerificationStatus("verified");
      toast.success("Medication scanned successfully");
      setTimeout(() => onVerified(), 800);
      return;
    }

    if (scannedCode.trim().toUpperCase() === expectedBarcode.toUpperCase()) {
      setVerificationStatus("verified");
      toast.success("Medication verified - barcode matches");
      setTimeout(() => onVerified(), 800);
    } else {
      setVerificationStatus("failed");
      toast.error("Barcode does not match!");
    }
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) {
      toast.error("Please enter a barcode");
      return;
    }
    verifyBarcode(manualCode);
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
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="font-medium">{medicationName}</p>
            {expectedBarcode && (
              <p className="text-xs text-muted-foreground mt-1">Expected: {expectedBarcode}</p>
            )}
          </div>

          {verificationStatus !== "pending" && (
            <div className={`p-4 rounded-lg text-center ${
              verificationStatus === "verified"
                ? "bg-emerald-500/10 border border-emerald-500/20"
                : "bg-destructive/10 border border-destructive/20"
            }`}>
              {verificationStatus === "verified" ? (
                <>
                  <CheckCircle className="h-12 w-12 mx-auto text-emerald-500 mb-2" />
                  <p className="font-medium text-emerald-600 dark:text-emerald-400">Medication Verified</p>
                </>
              ) : (
                <>
                  <XCircle className="h-12 w-12 mx-auto text-destructive mb-2" />
                  <p className="font-medium text-destructive">Verification Failed</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={resetVerification}>
                    Try Again
                  </Button>
                </>
              )}
            </div>
          )}

          {verificationStatus === "pending" && (
            <>
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
                  onClick={() => { stopScanner(); setMode("manual"); }}
                >
                  <Keyboard className="h-4 w-4 mr-2" />
                  Manual
                </Button>
              </div>

              {mode === "camera" ? (
                <div className="space-y-3">
                  <div id={scannerContainerId} className="w-full aspect-video bg-muted rounded-lg overflow-hidden" />
                  {isScanning && (
                    <p className="text-xs text-center text-muted-foreground">
                      Position barcode within the frame to scan automatically
                    </p>
                  )}
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
