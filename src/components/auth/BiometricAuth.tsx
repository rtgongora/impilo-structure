import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Fingerprint, 
  Scan, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { BiometricUtils, ProviderRegistryService } from '@/services/registryServices';

type BiometricMethod = 'fingerprint' | 'facial' | 'iris';

interface BiometricAuthProps {
  providerId: string;
  onVerified: (method: BiometricMethod, confidence: number) => void;
  onFailed: (error: string) => void;
  onCancel: () => void;
  requiredMethods?: BiometricMethod[];
}

interface MethodConfig {
  icon: React.ElementType;
  label: string;
  instruction: string;
  scanDuration: number;
}

const methodConfigs: Record<BiometricMethod, MethodConfig> = {
  fingerprint: {
    icon: Fingerprint,
    label: 'Fingerprint',
    instruction: 'Place your finger on the scanner',
    scanDuration: 2000
  },
  facial: {
    icon: Scan,
    label: 'Facial Recognition',
    instruction: 'Look directly at the camera',
    scanDuration: 3000
  },
  iris: {
    icon: Eye,
    label: 'Iris Scan',
    instruction: 'Keep your eye steady and look at the light',
    scanDuration: 2500
  }
};

type ScanState = 'idle' | 'scanning' | 'processing' | 'success' | 'failed';

export const BiometricAuth: React.FC<BiometricAuthProps> = ({
  providerId,
  onVerified,
  onFailed,
  onCancel,
  requiredMethods = ['fingerprint']
}) => {
  const [selectedMethod, setSelectedMethod] = useState<BiometricMethod>(requiredMethods[0]);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<{ confidence: number } | null>(null);

  const config = methodConfigs[selectedMethod];
  const Icon = config.icon;

  const startVerification = useCallback(async () => {
    setScanState('scanning');
    setProgress(0);
    setErrorMessage(null);

    // Simulate scanning progress
    const scanInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(scanInterval);
          return 100;
        }
        return prev + (100 / (config.scanDuration / 50));
      });
    }, 50);

    // Wait for scan to complete
    await new Promise(resolve => setTimeout(resolve, config.scanDuration));
    clearInterval(scanInterval);
    setProgress(100);

    setScanState('processing');

    try {
      // Generate mock biometric hash
      const captureData = `${selectedMethod}-${Date.now()}-${Math.random()}`;
      const hash = BiometricUtils.generateHash(selectedMethod, captureData);
      
      // Verify with registry service
      const result = await ProviderRegistryService.verifyBiometric(
        providerId,
        hash,
        selectedMethod
      );

      if (result.success) {
        setScanState('success');
        setVerificationResult({ confidence: result.confidence });
        
        // Short delay before callback
        setTimeout(() => {
          onVerified(selectedMethod, result.confidence);
        }, 1000);
      } else {
        setScanState('failed');
        setErrorMessage(result.error || 'Verification failed');
      }
    } catch (error) {
      setScanState('failed');
      setErrorMessage('An error occurred during verification');
    }
  }, [selectedMethod, providerId, config.scanDuration, onVerified]);

  const retry = () => {
    setScanState('idle');
    setProgress(0);
    setErrorMessage(null);
    setVerificationResult(null);
  };

  const handleFailed = () => {
    onFailed(errorMessage || 'Biometric verification failed');
  };

  return (
    <Card className="w-full max-w-md shadow-lg border-border/50">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Biometric Verification
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Verify your identity using biometrics
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Method Selection */}
        {scanState === 'idle' && requiredMethods.length > 1 && (
          <div className="flex gap-2 justify-center">
            {requiredMethods.map((method) => {
              const MethodIcon = methodConfigs[method].icon;
              return (
                <Button
                  key={method}
                  variant={selectedMethod === method ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMethod(method)}
                  className="flex items-center gap-2"
                >
                  <MethodIcon className="w-4 h-4" />
                  {methodConfigs[method].label}
                </Button>
              );
            })}
          </div>
        )}

        {/* Biometric Scanner Visualization */}
        <div className="relative w-48 h-48 mx-auto">
          <motion.div
            className={cn(
              "absolute inset-0 rounded-full border-4 flex items-center justify-center",
              scanState === 'idle' && "border-muted bg-muted/20",
              scanState === 'scanning' && "border-primary bg-primary/10",
              scanState === 'processing' && "border-amber-500 bg-amber-500/10",
              scanState === 'success' && "border-emerald-500 bg-emerald-500/10",
              scanState === 'failed' && "border-destructive bg-destructive/10"
            )}
            animate={scanState === 'scanning' ? {
              scale: [1, 1.02, 1],
              borderColor: ['hsl(var(--primary))', 'hsl(var(--primary) / 0.5)', 'hsl(var(--primary))']
            } : {}}
            transition={{ duration: 1, repeat: scanState === 'scanning' ? Infinity : 0 }}
          >
            <AnimatePresence mode="wait">
              {scanState === 'idle' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Icon className="w-20 h-20 text-muted-foreground" />
                </motion.div>
              )}

              {scanState === 'scanning' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative"
                >
                  <Icon className="w-20 h-20 text-primary" />
                  <motion.div
                    className="absolute inset-0 bg-primary/20 rounded-full"
                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                </motion.div>
              )}

              {scanState === 'processing' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader2 className="w-20 h-20 text-amber-500 animate-spin" />
                </motion.div>
              )}

              {scanState === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <CheckCircle2 className="w-20 h-20 text-emerald-500" />
                </motion.div>
              )}

              {scanState === 'failed' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <XCircle className="w-20 h-20 text-destructive" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Scanning line effect */}
          {scanState === 'scanning' && (
            <motion.div
              className="absolute left-4 right-4 h-0.5 bg-primary"
              initial={{ top: '10%' }}
              animate={{ top: ['10%', '90%', '10%'] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>

        {/* Progress Bar */}
        {(scanState === 'scanning' || scanState === 'processing') && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-center text-muted-foreground">
              {scanState === 'scanning' ? config.instruction : 'Verifying with registry...'}
            </p>
          </div>
        )}

        {/* Success Message */}
        {scanState === 'success' && verificationResult && (
          <div className="text-center space-y-2">
            <p className="text-emerald-600 font-medium">Verification Successful</p>
            <p className="text-sm text-muted-foreground">
              Match confidence: {(verificationResult.confidence * 100).toFixed(1)}%
            </p>
          </div>
        )}

        {/* Error Message */}
        {scanState === 'failed' && errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{errorMessage}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {scanState === 'idle' && (
            <>
              <Button variant="outline" className="flex-1" onClick={onCancel}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={startVerification}>
                Start Scan
              </Button>
            </>
          )}

          {scanState === 'failed' && (
            <>
              <Button variant="outline" className="flex-1" onClick={handleFailed}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={retry}>
                Try Again
              </Button>
            </>
          )}
        </div>

        {/* Provider ID Display */}
        <div className="pt-4 border-t">
          <p className="text-xs text-center text-muted-foreground">
            Provider ID: <span className="font-mono">{providerId}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BiometricAuth;
