import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ScanLine,
  Camera,
  Upload,
  FileText,
  Pill,
  TestTube,
  CreditCard,
  Heart,
  X,
  Check,
  RotateCw,
  Loader2,
} from "lucide-react";

interface DocumentType {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const documentTypes: DocumentType[] = [
  { id: "prescription", label: "Prescription", icon: Pill, color: "bg-emerald-500" },
  { id: "lab-result", label: "Lab Result", icon: TestTube, color: "bg-amber-500" },
  { id: "medical-record", label: "Medical Record", icon: FileText, color: "bg-blue-500" },
  { id: "insurance-card", label: "Insurance Card", icon: CreditCard, color: "bg-purple-500" },
  { id: "id-document", label: "ID Document", icon: CreditCard, color: "bg-slate-500" },
  { id: "other", label: "Other Document", icon: Heart, color: "bg-pink-500" },
];

interface HealthDocumentScannerProps {
  variant?: "button" | "card" | "floating";
  className?: string;
}

export function HealthDocumentScanner({ variant = "button", className }: HealthDocumentScannerProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"select" | "capture" | "preview" | "details">("select");
  const [selectedType, setSelectedType] = useState<string>("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [documentName, setDocumentName] = useState("");
  const [documentNotes, setDocumentNotes] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const resetScanner = () => {
    setStep("select");
    setSelectedType("");
    setCapturedImage(null);
    setDocumentName("");
    setDocumentNotes("");
    stopCamera();
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetScanner();
    }
  };

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Camera error:", error);
      toast.error("Could not access camera. Please try uploading instead.");
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        setCapturedImage(imageData);
        stopCamera();
        setStep("preview");
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
        setStep("preview");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveDocument = async () => {
    if (!capturedImage || !selectedType) return;
    
    setIsProcessing(true);
    
    // Simulate processing - in real implementation, this would upload to storage
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const docType = documentTypes.find((t) => t.id === selectedType);
    toast.success(`${docType?.label || "Document"} saved successfully!`);
    
    setIsProcessing(false);
    handleOpenChange(false);
  };

  const renderTrigger = () => {
    if (variant === "floating") {
      return (
        <Button
          size="lg"
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
        >
          <ScanLine className="h-6 w-6" />
        </Button>
      );
    }
    
    if (variant === "card") {
      return (
        <Card className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all group">
          <CardContent className="pt-6 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center">
              <ScanLine className="h-7 w-7 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-medium">Scan Document</p>
              <p className="text-xs text-muted-foreground">Capture health documents</p>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Button variant="outline" className={className}>
        <ScanLine className="h-4 w-4 mr-2" />
        Scan Document
      </Button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {renderTrigger()}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-primary" />
            Health Document Scanner
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Select Document Type */}
        {step === "select" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">What type of document are you scanning?</p>
            <div className="grid grid-cols-2 gap-3">
              {documentTypes.map((type) => (
                <Button
                  key={type.id}
                  variant={selectedType === type.id ? "default" : "outline"}
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => setSelectedType(type.id)}
                >
                  <div className={`w-10 h-10 rounded-lg ${type.color} flex items-center justify-center`}>
                    <type.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs">{type.label}</span>
                </Button>
              ))}
            </div>
            
            {selectedType && (
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setStep("capture");
                    startCamera();
                  }}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        )}

        {/* Step 2: Camera Capture */}
        {step === "capture" && (
          <div className="space-y-4">
            <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
              {isCapturing ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              )}
              
              {/* Scan overlay */}
              <div className="absolute inset-4 border-2 border-white/50 rounded-lg pointer-events-none">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary" />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  stopCamera();
                  setStep("select");
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button className="flex-1" onClick={capturePhoto} disabled={!isCapturing}>
                <Camera className="h-4 w-4 mr-2" />
                Capture
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === "preview" && capturedImage && (
          <div className="space-y-4">
            <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
              <img
                src={capturedImage}
                alt="Captured document"
                className="w-full h-full object-contain"
              />
              <Badge className="absolute top-2 right-2" variant="secondary">
                {documentTypes.find((t) => t.id === selectedType)?.label}
              </Badge>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setCapturedImage(null);
                  setStep("select");
                }}
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Retake
              </Button>
              <Button className="flex-1" onClick={() => setStep("details")}>
                <Check className="h-4 w-4 mr-2" />
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Document Details */}
        {step === "details" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              {capturedImage && (
                <img
                  src={capturedImage}
                  alt="Document preview"
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div>
                <Badge variant="secondary">
                  {documentTypes.find((t) => t.id === selectedType)?.label}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Ready to save</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="doc-name">Document Name (optional)</Label>
                <Input
                  id="doc-name"
                  placeholder="e.g., Blood Test Results - Dec 2024"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="doc-notes">Notes (optional)</Label>
                <Textarea
                  id="doc-notes"
                  placeholder="Add any notes about this document..."
                  value={documentNotes}
                  onChange={(e) => setDocumentNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("preview")}>
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveDocument}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save Document
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
