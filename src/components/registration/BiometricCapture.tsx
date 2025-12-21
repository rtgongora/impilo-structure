import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Fingerprint, 
  Eye, 
  Camera, 
  Check, 
  RefreshCw, 
  AlertCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type BiometricType = "fingerprint" | "iris" | "facial";

interface BiometricCaptureProps {
  type: BiometricType;
  onCapture: (data: BiometricData) => void;
  onSkip?: () => void;
  required?: boolean;
}

export interface BiometricData {
  type: BiometricType;
  capturedAt: Date;
  quality: number;
  hash: string;
  verified: boolean;
}

type CaptureState = "idle" | "scanning" | "processing" | "success" | "error";

const biometricConfig = {
  fingerprint: {
    icon: Fingerprint,
    label: "Fingerprint",
    instruction: "Place your finger on the scanner",
    scanTime: 2000,
  },
  iris: {
    icon: Eye,
    label: "Iris Scan",
    instruction: "Look into the scanner and keep your eyes open",
    scanTime: 3000,
  },
  facial: {
    icon: Camera,
    label: "Facial Recognition",
    instruction: "Look directly at the camera",
    scanTime: 2500,
  },
};

export function BiometricCapture({ 
  type, 
  onCapture, 
  onSkip,
  required = true 
}: BiometricCaptureProps) {
  const [state, setState] = useState<CaptureState>("idle");
  const [progress, setProgress] = useState(0);
  const [quality, setQuality] = useState(0);

  const config = biometricConfig[type];
  const Icon = config.icon;

  const startCapture = () => {
    setState("scanning");
    setProgress(0);
    
    // Simulate scanning progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, config.scanTime / 10);

    // Simulate scan completion
    setTimeout(() => {
      setState("processing");
      setProgress(100);
      
      // Simulate processing
      setTimeout(() => {
        const capturedQuality = 85 + Math.random() * 15;
        setQuality(Math.round(capturedQuality));
        
        if (capturedQuality >= 70) {
          setState("success");
          onCapture({
            type,
            capturedAt: new Date(),
            quality: Math.round(capturedQuality),
            hash: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            verified: true,
          });
        } else {
          setState("error");
        }
      }, 1000);
    }, config.scanTime);
  };

  const retry = () => {
    setState("idle");
    setProgress(0);
    setQuality(0);
  };

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="w-5 h-5 text-primary" />
          {config.label} Capture
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Biometric Visualization */}
        <div className="relative aspect-square max-w-xs mx-auto">
          <motion.div
            className={cn(
              "absolute inset-0 rounded-full border-4 flex items-center justify-center transition-colors duration-300",
              state === "idle" && "border-muted bg-muted/10",
              state === "scanning" && "border-primary bg-primary/10",
              state === "processing" && "border-warning bg-warning/10",
              state === "success" && "border-success bg-success/10",
              state === "error" && "border-destructive bg-destructive/10"
            )}
            animate={state === "scanning" ? { scale: [1, 1.02, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <AnimatePresence mode="wait">
              {state === "idle" && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-center"
                >
                  <Icon className="w-20 h-20 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{config.instruction}</p>
                </motion.div>
              )}
              
              {state === "scanning" && (
                <motion.div
                  key="scanning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  >
                    <Icon className="w-20 h-20 text-primary mx-auto" />
                  </motion.div>
                  <p className="text-sm text-primary font-medium mt-2">Scanning...</p>
                </motion.div>
              )}
              
              {state === "processing" && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <Loader2 className="w-20 h-20 text-warning mx-auto animate-spin" />
                  <p className="text-sm text-warning font-medium mt-2">Processing...</p>
                </motion.div>
              )}
              
              {state === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto">
                    <Check className="w-10 h-10 text-success" />
                  </div>
                  <p className="text-sm text-success font-medium mt-2">Captured Successfully</p>
                  <p className="text-xs text-muted-foreground">Quality: {quality}%</p>
                </motion.div>
              )}
              
              {state === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <AlertCircle className="w-20 h-20 text-destructive mx-auto" />
                  <p className="text-sm text-destructive font-medium mt-2">Capture Failed</p>
                  <p className="text-xs text-muted-foreground">Poor quality. Please try again.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          {/* Scanning ring animation */}
          {state === "scanning" && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary"
              initial={{ scale: 0.8, opacity: 1 }}
              animate={{ scale: 1.2, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          )}
        </div>

        {/* Progress bar during scanning */}
        {(state === "scanning" || state === "processing") && (
          <Progress value={progress} className="h-2" />
        )}

        {/* Quality indicator for success */}
        {state === "success" && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Capture Quality</span>
            <span className={cn(
              "font-medium",
              quality >= 90 ? "text-success" : quality >= 70 ? "text-warning" : "text-destructive"
            )}>
              {quality}% - {quality >= 90 ? "Excellent" : quality >= 70 ? "Good" : "Poor"}
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {state === "idle" && (
            <>
              <Button onClick={startCapture} className="flex-1">
                <Icon className="w-4 h-4 mr-2" />
                Start Capture
              </Button>
              {!required && onSkip && (
                <Button variant="outline" onClick={onSkip}>
                  Skip
                </Button>
              )}
            </>
          )}
          
          {(state === "success" || state === "error") && (
            <Button 
              variant={state === "error" ? "default" : "outline"} 
              onClick={retry}
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {state === "error" ? "Try Again" : "Recapture"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface BiometricSummaryProps {
  captures: BiometricData[];
}

export function BiometricSummary({ captures }: BiometricSummaryProps) {
  const allTypes: BiometricType[] = ["fingerprint", "iris", "facial"];
  
  return (
    <div className="space-y-3">
      {allTypes.map((type) => {
        const capture = captures.find(c => c.type === type);
        const config = biometricConfig[type];
        const Icon = config.icon;
        
        return (
          <div
            key={type}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border",
              capture ? "border-success/50 bg-success/5" : "border-muted bg-muted/5"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              capture ? "bg-success/20" : "bg-muted"
            )}>
              {capture ? (
                <Check className="w-5 h-5 text-success" />
              ) : (
                <Icon className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{config.label}</p>
              {capture ? (
                <p className="text-xs text-success">
                  Captured • Quality: {capture.quality}%
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Not captured</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
