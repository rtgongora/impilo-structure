import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  Shield,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";

interface DocumentType {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  requiresConfidentiality?: boolean;
}

const documentTypes: DocumentType[] = [
  { id: "prescription", label: "Prescription", icon: Pill, color: "bg-emerald-500", requiresConfidentiality: true },
  { id: "lab-result", label: "Lab Result", icon: TestTube, color: "bg-amber-500", requiresConfidentiality: true },
  { id: "medical-record", label: "Medical Record", icon: FileText, color: "bg-blue-500", requiresConfidentiality: true },
  { id: "insurance-card", label: "Insurance Card", icon: CreditCard, color: "bg-purple-500" },
  { id: "id-document", label: "ID Document", icon: CreditCard, color: "bg-slate-500" },
  { id: "imaging", label: "X-Ray / Scan", icon: Eye, color: "bg-indigo-500", requiresConfidentiality: true },
  { id: "other", label: "Other Document", icon: Heart, color: "bg-pink-500" },
];

export interface ScannedDocument {
  id: string;
  type: string;
  name: string;
  imageData: string;
  notes: string;
  isConfidential: boolean;
  visibility: "private" | "care-team" | "community";
  scannedAt: Date;
}

interface ClinicalDocumentScannerProps {
  variant?: "button" | "icon" | "inline";
  context?: "timeline" | "encounter" | "teleconsult" | "referral";
  onDocumentScanned?: (doc: ScannedDocument) => void;
  className?: string;
  buttonLabel?: string;
  showConfidentialityControls?: boolean;
}

export function ClinicalDocumentScanner({ 
  variant = "button", 
  context = "encounter",
  onDocumentScanned,
  className,
  buttonLabel = "Scan Document",
  showConfidentialityControls = true,
}: ClinicalDocumentScannerProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"select" | "capture" | "preview" | "details">("select");
  const [selectedType, setSelectedType] = useState<string>("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [documentName, setDocumentName] = useState("");
  const [documentNotes, setDocumentNotes] = useState("");
  const [isConfidential, setIsConfidential] = useState(true);
  const [visibility, setVisibility] = useState<"private" | "care-team" | "community">("care-team");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const resetScanner = () => {
    setStep("select");
    setSelectedType("");
    setCapturedImage(null);
    setDocumentName("");
    setDocumentNotes("");
    setIsConfidential(true);
    setVisibility("care-team");
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
    
    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const docType = documentTypes.find((t) => t.id === selectedType);
    const scannedDoc: ScannedDocument = {
      id: `doc-${Date.now()}`,
      type: selectedType,
      name: documentName || `${docType?.label} - ${new Date().toLocaleDateString()}`,
      imageData: capturedImage,
      notes: documentNotes,
      isConfidential,
      visibility,
      scannedAt: new Date(),
    };
    
    onDocumentScanned?.(scannedDoc);
    toast.success(`${docType?.label || "Document"} added successfully!`);
    
    setIsProcessing(false);
    handleOpenChange(false);
  };

  const getContextLabel = () => {
    switch (context) {
      case "timeline": return "Share with Community";
      case "encounter": return "Add to Patient Record";
      case "teleconsult": return "Share in Consultation";
      case "referral": return "Attach to Referral";
      default: return "Save Document";
    }
  };

  const getVisibilityOptions = () => {
    if (context === "timeline") {
      return [
        { value: "private", label: "Only Me", icon: Lock },
        { value: "care-team", label: "My Care Team", icon: Shield },
        { value: "community", label: "Community", icon: Eye },
      ];
    }
    return [
      { value: "private", label: "Only Me", icon: Lock },
      { value: "care-team", label: "Care Team", icon: Shield },
    ];
  };

  const renderTrigger = () => {
    if (variant === "icon") {
      return (
        <Button variant="ghost" size="icon" className={className}>
          <ScanLine className="h-4 w-4" />
        </Button>
      );
    }
    
    if (variant === "inline") {
      return (
        <div className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/30 transition-colors ${className}`}>
          <ScanLine className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium">{buttonLabel}</p>
          <p className="text-xs text-muted-foreground">Camera or upload</p>
        </div>
      );
    }
    
    return (
      <Button variant="outline" className={className}>
        <ScanLine className="h-4 w-4 mr-2" />
        {buttonLabel}
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
            Scan Health Document
            {context === "timeline" && (
              <Badge variant="secondary" className="ml-2">Community</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Select Document Type */}
        {step === "select" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Select document type:</p>
            <div className="grid grid-cols-2 gap-3">
              {documentTypes.map((type) => (
                <Button
                  key={type.id}
                  variant={selectedType === type.id ? "default" : "outline"}
                  className="h-auto py-3 flex flex-col items-center gap-2 relative"
                  onClick={() => setSelectedType(type.id)}
                >
                  <div className={`w-9 h-9 rounded-lg ${type.color} flex items-center justify-center`}>
                    <type.icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs">{type.label}</span>
                  {type.requiresConfidentiality && (
                    <Shield className="h-3 w-3 absolute top-1 right-1 text-muted-foreground" />
                  )}
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
                  Upload
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setStep("capture");
                    startCamera();
                  }}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Camera
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
              
              <div className="absolute inset-4 border-2 border-white/50 rounded-lg pointer-events-none">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary" />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { stopCamera(); setStep("select"); }}>
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
              <Button variant="outline" onClick={() => { setCapturedImage(null); setStep("select"); }}>
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

        {/* Step 4: Details with Confidentiality */}
        {step === "details" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              {capturedImage && (
                <img src={capturedImage} alt="Preview" className="w-14 h-14 object-cover rounded" />
              )}
              <div className="flex-1">
                <Badge variant="secondary">
                  {documentTypes.find((t) => t.id === selectedType)?.label}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Ready to save</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="doc-name">Document Name</Label>
                <Input
                  id="doc-name"
                  placeholder="e.g., Blood Test Results"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="doc-notes">Notes</Label>
                <Textarea
                  id="doc-notes"
                  placeholder="Add notes..."
                  value={documentNotes}
                  onChange={(e) => setDocumentNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Confidentiality Controls */}
              {showConfidentialityControls && (
                <>
                  <div className="flex items-center justify-between p-3 bg-warning/10 border border-warning/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-warning" />
                      <div>
                        <p className="text-sm font-medium">Confidential Document</p>
                        <p className="text-xs text-muted-foreground">Protected health information</p>
                      </div>
                    </div>
                    <Switch
                      checked={isConfidential}
                      onCheckedChange={setIsConfidential}
                    />
                  </div>

                  {context === "timeline" && (
                    <div>
                      <Label>Who can see this?</Label>
                      <Select value={visibility} onValueChange={(v) => setVisibility(v as typeof visibility)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getVisibilityOptions().map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <div className="flex items-center gap-2">
                                <opt.icon className="h-4 w-4" />
                                {opt.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {visibility === "community" && isConfidential && (
                        <div className="flex items-center gap-2 mt-2 p-2 bg-destructive/10 rounded text-destructive text-xs">
                          <AlertTriangle className="h-3 w-3" />
                          Sensitive info will be redacted before sharing
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep("preview")}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleSaveDocument} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {getContextLabel()}
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
